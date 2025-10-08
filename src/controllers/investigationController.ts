import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 조사 시작
export const startInvestigation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // 1. 유저 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    const currentDay = user.current_day;

    // 2. 오늘의 조사 횟수 확인
    let dailyCount = await prisma.$queryRaw<any[]>`
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    if (dailyCount.length === 0) {
      // 새로운 날의 첫 조사
      await prisma.$executeRaw`
        INSERT INTO daily_investigation_count (user_id, day, count)
        VALUES (${userId}, ${currentDay}, 0)
      `;
      dailyCount = await prisma.$queryRaw<any[]>`
        SELECT * FROM daily_investigation_count 
        WHERE user_id = ${userId} AND day = ${currentDay}
      `;
    }

    const investigationCount = dailyCount[0].count;

    // 3. 하루 3번 제한 체크
    if (investigationCount >= 3) {
      return res.status(400).json({ 
        error: '오늘의 조사 기회를 모두 사용했습니다.',
        remainingInvestigations: 0,
        currentDay
      });
    }

    // 4. 활성 세션이 있는지 확인
    const activeSessions = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (activeSessions.length > 0) {
      // 기존 활성 세션 반환
      return res.json({
        message: '진행 중인 조사가 있습니다.',
        session: activeSessions[0],
        remainingInvestigations: 3 - investigationCount
      });
    }

    // 5. 새로운 조사 세션 시작 (항상 노드 1부터)
    await prisma.$executeRaw`
      INSERT INTO investigation_sessions 
      (user_id, day, session_number, hp, energy, gold_start, current_node_id, status)
      VALUES (${userId}, ${currentDay}, ${investigationCount + 1}, 3, 3, ${user.gold}, 1, 'active')
    `;
    
    console.log('새 조사 세션 시작 - 노드 1부터');

    // 6. 조사 횟수 증가
    await prisma.$executeRaw`
      UPDATE daily_investigation_count 
      SET count = ${investigationCount + 1}
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    // 7. 생성된 세션 가져오기
    const newSession = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    return res.json({
      message: '조사를 시작합니다!',
      session: newSession[0],
      remainingInvestigations: 3 - (investigationCount + 1),
      currentDay
    });

  } catch (error) {
    console.error('조사 시작 오류:', error);
    return res.status(500).json({ error: '조사 시작 중 오류가 발생했습니다.' });
  }
};

// 현재 조사 세션 정보 가져오기
export const getCurrentSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const activeSessions = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (activeSessions.length === 0) {
      return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
    }

    return res.json({ session: activeSessions[0] });

  } catch (error) {
    console.error('세션 조회 오류:', error);
    return res.status(500).json({ error: '세션 조회 중 오류가 발생했습니다.' });
  }
};

// 체력/정신력 업데이트
export const updateSessionStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { hp, energy, gold } = req.body;

    // 1. 활성 세션 가져오기
    const activeSessions = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (activeSessions.length === 0) {
      return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
    }

    const session = activeSessions[0];

    // 2. 체력 또는 정신력이 0 이하인지 체크
    const shouldEnd = hp <= 0 || energy <= 0;

    if (shouldEnd) {
      // 조사 종료 - 세션 종료 후 골드를 사용자 테이블에 반영
      await prisma.$executeRaw`
        UPDATE investigation_sessions 
        SET hp = ${hp}, energy = ${energy}, gold_end = ${gold}, 
            status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ${session.id}
      `;

      // 최종 골드를 사용자 테이블에 반영
      await prisma.$executeRaw`
        UPDATE users 
        SET gold = ${gold}
        WHERE id = ${userId}
      `;

      console.log(`조사 종료 - 최종 골드 반영: ${gold}`);

      return res.json({
        message: '조사가 종료되었습니다.',
        session: {
          ...session,
          hp,
          energy,
          gold_end: gold,
          status: 'completed'
        },
        ended: true
      });
    }

    // 3. 세션 업데이트 (진행 중) - 세션에서만 관리
    await prisma.$executeRaw`
      UPDATE investigation_sessions 
      SET hp = ${hp}, energy = ${energy}, gold_end = ${gold}
      WHERE id = ${session.id}
    `;
    
    console.log(`세션 진행 중 - 골드 업데이트: ${gold} (사용자 테이블은 세션 종료 시 반영)`);

    return res.json({
      message: '조사 진행 중',
      session: {
        ...session,
        hp,
        energy,
        gold_end: gold
      },
      ended: false
    });

  } catch (error) {
    console.error('스탯 업데이트 오류:', error);
    return res.status(500).json({ error: '스탯 업데이트 중 오류가 발생했습니다.' });
  }
};

// 조사 종료 (수동)
export const endInvestigation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // 1. 활성 세션 가져오기
    const activeSessions = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (activeSessions.length === 0) {
      return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
    }

    const session = activeSessions[0];

    // 2. 세션 종료 및 최종 골드 반영
    const finalGold = session.gold_end ?? session.gold_start;
    await prisma.$executeRaw`
      UPDATE investigation_sessions 
      SET status = 'completed', ended_at = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
    `;

    // 3. 최종 골드를 사용자 테이블에 반영
    await prisma.$executeRaw`
      UPDATE users 
      SET gold = ${finalGold}
      WHERE id = ${userId}
    `;
    
    console.log(`수동 조사 종료 - 최종 골드 반영: ${finalGold}`);

    return res.json({
      message: '조사를 종료했습니다.',
      session: {
        ...session,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('조사 종료 오류:', error);
    return res.status(500).json({ error: '조사 종료 중 오류가 발생했습니다.' });
  }
};

// 게임 시작 (조사 시작과 동일)
export const enterStoryDay = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { day } = req.params;

    console.log(`게임 시작 요청: Day ${day}, User ${userId}`);

    // startInvestigation과 동일한 로직
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    const currentDay = user.current_day;

    // 오늘의 조사 횟수 확인
    let dailyCount = await prisma.$queryRaw<any[]>`
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    if (dailyCount.length === 0) {
      // 새로운 날의 첫 조사
      await prisma.$executeRaw`
        INSERT INTO daily_investigation_count (user_id, day, count)
        VALUES (${userId}, ${currentDay}, 0)
      `;
      dailyCount = await prisma.$queryRaw<any[]>`
        SELECT * FROM daily_investigation_count 
        WHERE user_id = ${userId} AND day = ${currentDay}
      `;
    }

    const investigationCount = dailyCount[0].count;

    // 하루 3번 제한 체크
    if (investigationCount >= 3) {
      return res.status(400).json({ 
        error: '오늘의 조사 기회를 모두 사용했습니다.',
        remainingInvestigations: 0,
        currentDay
      });
    }

    // 활성 세션이 있으면 종료하고 새로 시작
    const activeSessions = await prisma.$queryRaw<any[]>`
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (activeSessions.length > 0) {
      console.log('기존 활성 세션 종료하고 새로 시작');
      await prisma.$executeRaw`
        UPDATE investigation_sessions 
        SET status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ${activeSessions[0].id}
      `;
    }

    // 새로운 조사 세션 시작 (항상 노드 1부터)
    await prisma.$executeRaw`
      INSERT INTO investigation_sessions 
      (user_id, day, session_number, hp, energy, gold_start, current_node_id, status)
      VALUES (${userId}, ${currentDay}, ${investigationCount + 1}, 3, 3, ${user.gold}, 1, 'active')
    `;
    
    console.log('새 조사 세션 시작 - 노드 1부터');

    // 조사 횟수 증가
    await prisma.$executeRaw`
      UPDATE daily_investigation_count 
      SET count = ${investigationCount + 1}
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    // 시작 노드 조회
    const startNodes = await prisma.$queryRaw<any[]>`
      SELECT * FROM nodes WHERE story_id = 1 AND node_id = 1 LIMIT 1
    `;

    let startNodeData = null;
    if (startNodes.length > 0) {
      const node = startNodes[0];
      
      // 선택지 조회 (to_node의 node_id도 함께)
      const choices = await prisma.$queryRaw<any[]>`
        SELECT c.*, n.node_id as target_node_number
        FROM choices c
        JOIN nodes n ON c.to_node_id = n.id
        WHERE c.from_node_id = ${node.id} 
        ORDER BY c.order_num
      `;

      startNodeData = {
        nodeId: node.node_id,
        title: node.title,
        text: node.text_content,
        choices: choices.map(c => ({
          id: c.id,
          targetNodeId: c.target_node_number,
          label: c.choice_text,
          available: c.is_available
        })),
        nodeType: node.node_type
      };
    }

    return res.json({
      message: `${day}일차 게임을 시작합니다.`,
      progress: {
        current_chapter: currentDay,
        last_node_id: 1,
        investigation_count: investigationCount + 1
      },
      startNode: startNodeData,
      actionPointsRemaining: 3 - (investigationCount + 1)
    });

  } catch (error) {
    console.error('게임 시작 오류:', error);
    return res.status(500).json({ error: '게임 시작 중 오류가 발생했습니다.' });
  }
};

// 남은 조사 횟수 확인
export const getRemainingInvestigations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    const currentDay = user.current_day;

    // 오늘의 조사 횟수 확인
    const dailyCount = await prisma.$queryRaw<any[]>`
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    const investigationCount = dailyCount.length > 0 ? dailyCount[0].count : 0;
    const remaining = 3 - investigationCount;

    // 프론트엔드 호환성을 위한 형식
    return res.json({
      current: remaining,
      max: 3,
      nextRechargeAtIso: null // 간단히 null 처리
    });

  } catch (error) {
    console.error('조사 횟수 확인 오류:', error);
    return res.status(500).json({ error: '조사 횟수 확인 중 오류가 발생했습니다.' });
  }
};

// 조사 기회 충전 (골드 2개로 조사 기회 +1)
export const rechargeInvestigation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // 유저 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
    }

    // 골드 체크
    if (user.gold < 2) {
      return res.status(400).json({ 
        error: '골드가 부족합니다.',
        currentGold: user.gold,
        required: 2
      });
    }

    const currentDay = user.current_day;

    // 오늘의 조사 횟수 확인
    let dailyCount = await prisma.$queryRaw<any[]>`
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    if (dailyCount.length === 0) {
      // 새로운 날이면 초기화
      await prisma.$executeRaw`
        INSERT INTO daily_investigation_count (user_id, day, count)
        VALUES (${userId}, ${currentDay}, 0)
      `;
      dailyCount = await prisma.$queryRaw<any[]>`
        SELECT * FROM daily_investigation_count 
        WHERE user_id = ${userId} AND day = ${currentDay}
      `;
    }

    const investigationCount = dailyCount[0].count;
    const currentRemaining = 3 - investigationCount;

    // 조사 기회를 모두 사용했을 때만 충전 가능
    if (currentRemaining >= 3) {
      return res.status(400).json({ 
        error: '조사 기회가 이미 최대입니다.',
        remaining: currentRemaining
      });
    }

    // 카운트를 -1 감소 (조사 기회 +1)
    await prisma.$executeRaw`
      UPDATE daily_investigation_count 
      SET count = ${investigationCount - 1}
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;

    // 골드 차감
    await prisma.$executeRaw`
      UPDATE users 
      SET gold = ${user.gold - 2}
      WHERE id = ${userId}
    `;

    const newRemaining = 3 - (investigationCount - 1);

    return res.json({
      success: true,
      message: '조사 기회가 충전되었습니다!',
      remaining: newRemaining,
      goldSpent: 2,
      currentGold: user.gold - 2
    });

  } catch (error) {
    console.error('조사 기회 충전 오류:', error);
    return res.status(500).json({ error: '조사 기회 충전 중 오류가 발생했습니다.' });
  }
};

