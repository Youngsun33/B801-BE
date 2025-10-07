import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// 새로운 ERD 구조에 맞게 완전히 재작성된 스토리 컨트롤러
// 기존 코드는 모두 제거하고 필요한 기능만 구현

// 스토리 노드 조회 (새 ERD 구조)
export const getStoryNode = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    
    const nodeIdNum = parseInt(nodeId);
    if (isNaN(nodeIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 노드 ID입니다.' });
    }

    // nodes 테이블에서 노드 조회 (node_id로 조회)
    const node = await prisma.$queryRaw<any[]>`
      SELECT * FROM nodes WHERE node_id = ${nodeIdNum}
    `;

    if (!node || node.length === 0) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }
      
    const nodeData = node[0];
    let nodeText = nodeData.text_content;
    let rewards: any = undefined;

    // 노드 5: 돈 텍스트 표시
    if (nodeIdNum === 5) {
      nodeText = nodeData.text_content + '\n(돈 +1)';
    }

    // 노드 4: 랜덤 능력 2개 부여 - 방금 받은 능력 표시 (조회 시에는 사용 안 함, chooseStoryOption에서만 사용)
    if (nodeIdNum === 4) {
      console.log('⚠️ 노드 4 직접 조회 - 세션 데이터 확인');
      
      // 활성 세션에서 temp_data 조회
      const session = await prisma.$queryRaw<any[]>`
        SELECT temp_data FROM investigation_sessions 
        WHERE user_id = ${userId} AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
      `;

      let userAbilities = [];

      // 세션에 저장된 능력이 있으면 사용
      if (session.length > 0 && session[0].temp_data) {
        try {
          const tempData = JSON.parse(session[0].temp_data);
          if (tempData.node4Abilities) {
            userAbilities = tempData.node4Abilities;
            console.log('   → 세션에서 능력 로드:', userAbilities.map((a: any) => a.name));
          }
        } catch (e) {
          console.error('temp_data 파싱 실패:', e);
        }
      }
      
      // 세션에 없으면 가장 최근 능력 2개
      if (userAbilities.length === 0) {
        userAbilities = await prisma.$queryRaw<any[]>`
          SELECT ur.id, ur.quantity, r.name, r.description
          FROM user_resources ur
          JOIN resources r ON ur.resource_id = r.id
          WHERE ur.user_id = ${userId} AND r.type = 'SKILL'
          AND r.name IN ('관찰력', '근력', '민첩함', '은신술', '손재주', '언변술', '매력', '직감', '권총')
          ORDER BY ur.id DESC
          LIMIT 2
        `;
        console.log('   → DB에서 최근 능력:', userAbilities.map(a => a.name));
      }

      if (userAbilities.length > 0) {
        const abilityText = userAbilities.map((a: any) => 
          `+ ${a.name}\n${a.description}`
        ).join('\n\n');

        nodeText = `당신이 가진 능력이 깨어났습니다...\n\n이제 얻은 능력\n\n${abilityText}`;

        rewards = {
          abilities: userAbilities.map((a: any) => ({
            name: a.name,
            description: a.description
          }))
        };
      }
    }

    // 날짜 해금 규칙
    const unlockRules: Record<number, string> = {
      // 2일차 (2025-10-09)
      29: '2025-10-09',
      66: '2025-10-09',
      122: '2025-10-09',
      170: '2025-10-09',
      219: '2025-10-09',
      279: '2025-10-09',
      // 3일차 (2025-10-10)
      38: '2025-10-10',
      84: '2025-10-10',
      132: '2025-10-10',
      186: '2025-10-10',
      242: '2025-10-10',
      288: '2025-10-10',
    };

    const formatDateForKR = (isoDate: string) => {
      const d = new Date(isoDate + 'T00:00:00');
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${month}월 ${day}일`;
    };

    // 해당 노드의 선택지 조회 (DB id 사용)
    let choices = await prisma.$queryRaw<any[]>`
      SELECT c.*, n.node_id as target_node_number
      FROM choices c
      JOIN nodes n ON c.to_node_id = n.id
      WHERE c.from_node_id = ${nodeData.id}
      ORDER BY c.order_num ASC
    `;

    // 랜덤 허브 노드들(501-505)에서는 5개만 랜덤 선택
    if (nodeData.node_id >= 501 && nodeData.node_id <= 505) {
      if (choices.length > 5) {
        // 기존 선택지를 섞고 5개만 선택
        const shuffled = choices.sort(() => Math.random() - 0.5);
        choices = shuffled.slice(0, 5);
        console.log(`🎲 랜덤 허브 ${nodeData.node_id}: ${choices.length}개 선택지로 제한 (전체 ${shuffled.length}개 중에서)`);
      }
    }

    // 각 선택지의 제약조건 조회
    const choicesWithConstraints = await Promise.all(
      choices.map(async (choice) => {
        const constraints = await prisma.$queryRaw<any[]>`
          SELECT cc.*, r.name as resource_name, r.type as resource_type
          FROM choice_constraints cc
          JOIN resources r ON cc.resource_id = r.id
          WHERE cc.choice_id = ${choice.id}
        `;

        // 날짜 해금 적용
        const targetNodeNum: number = choice.target_node_number;
        const unlockDateIso = unlockRules[targetNodeNum];
        const today = new Date();
        const isLockedByDate = !!unlockDateIso && today < new Date(unlockDateIso + 'T00:00:00');
        const lockedUntil = unlockDateIso ? formatDateForKR(unlockDateIso) : undefined;

        return {
          id: choice.id,
          targetNodeId: choice.target_node_number,
          label: choice.choice_text,
          available: choice.is_available && !isLockedByDate,
          lockedUntil: isLockedByDate ? lockedUntil : undefined,
          requirements: constraints.map(c => ({
            type: c.resource_type,
            name: c.resource_name,
            value: c.required_value,
            operator: c.comparison_type
          }))
        };
      })
    );

    // 활성 세션 정보 조회
    const activeSession = await prisma.$queryRaw<any[]>`
      SELECT hp, energy, gold_start, gold_end FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    // 사용자 테이블에서 현재 골드 가져오기
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const sessionInfo = activeSession.length > 0 ? {
      hp: activeSession[0].hp,
      energy: activeSession[0].energy,
      gold: user ? user.gold : (activeSession[0].gold_end ?? activeSession[0].gold_start)
    } : null;

    return res.status(200).json({
      nodeId: nodeData.node_id,
      title: nodeData.title,
      text: nodeText,
      imageUrl: nodeData.image_url, // 이미지 URL 전달
      nodeType: nodeData.node_type,
      choices: choicesWithConstraints,
      rewards,
      session: sessionInfo
    });

  } catch (error) {
    console.error('노드 조회 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 선택지 선택 (새 ERD 구조)
export const chooseStoryOption = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { choiceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!choiceId) {
      return res.status(400).json({ error: 'choiceId가 필요합니다.' });
    }

    // 선택지 조회
    const choices = await prisma.$queryRaw<any[]>`
      SELECT * FROM choices WHERE id = ${choiceId}
    `;

    if (!choices || choices.length === 0) {
      return res.status(404).json({ error: '선택지를 찾을 수 없습니다.' });
    }

    const choice = choices[0];

    // 제약조건 확인
    const constraints = await prisma.$queryRaw<any[]>`
      SELECT cc.*, r.name, r.type 
      FROM choice_constraints cc
      JOIN resources r ON cc.resource_id = r.id
      WHERE cc.choice_id = ${choiceId}
    `;

    // 사용자 자원 확인
    for (const constraint of constraints) {
      let currentValue = 0;

      // STAT 타입(돈, 체력 등)은 사용자 테이블에서 확인
      if (constraint.type === 'STAT') {
        if (constraint.name === '돈') {
          // 사용자 테이블에서 현재 골드 가져오기
          const user = await prisma.user.findUnique({ where: { id: userId } });
          currentValue = user ? user.gold : 0;
        } else if (constraint.name === '체력') {
          const session = await prisma.$queryRaw<any[]>`
            SELECT hp FROM investigation_sessions 
            WHERE user_id = ${userId} AND status = 'active'
            LIMIT 1
          `;
          currentValue = session.length > 0 ? session[0].hp : 3;
        } else if (constraint.name === '정신력' || constraint.name === '에너지') {
          const session = await prisma.$queryRaw<any[]>`
            SELECT energy FROM investigation_sessions 
            WHERE user_id = ${userId} AND status = 'active'
            LIMIT 1
          `;
          currentValue = session.length > 0 ? session[0].energy : 3;
        }
      } else {
        // SKILL, ITEM은 user_resources에서 확인
        const userResources = await prisma.$queryRaw<any[]>`
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${constraint.resource_id}
        `;
        currentValue = userResources[0]?.quantity || 0;
      }

      // 비교 연산자에 따라 체크
      let isValid = false;
      switch (constraint.comparison_type) {
        case '>=':
          isValid = currentValue >= constraint.required_value;
          break;
        case '<=':
          isValid = currentValue <= constraint.required_value;
          break;
        case '==':
          isValid = currentValue === constraint.required_value;
          break;
        case '>':
          isValid = currentValue > constraint.required_value;
          break;
        case '<':
          isValid = currentValue < constraint.required_value;
          break;
        default:
          isValid = currentValue >= constraint.required_value;
      }

      console.log(`제약조건 확인: ${constraint.name} (${constraint.type}) - 필요: ${constraint.required_value}, 보유: ${currentValue}, 결과: ${isValid}`);

      if (!isValid) {
        return res.status(400).json({
          error: `요구사항 미충족: ${constraint.name} (필요: ${constraint.required_value}, 보유: ${currentValue})`
        });
      }
    }

    // 결과 적용
    const results = await prisma.$queryRaw<any[]>`
      SELECT cr.*, r.name, r.type 
      FROM choice_results cr
      JOIN resources r ON cr.resource_id = r.id
      WHERE cr.choice_id = ${choiceId}
    `;

    const delta: any = {};
    
    for (const result of results) {
      console.log('결과 적용:', result.name, result.value_change);

      // STAT 타입(체력, 정신력, 돈 등)은 세션에서 관리하고 세션 종료 시 사용자 테이블에 반영
      if (result.type === 'STAT') {
        if (result.name === '돈') {
          // 사용자 테이블에서 현재 골드 가져오기
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            const newGold = Math.max(0, user.gold + result.value_change);
            
            // 사용자 테이블에 즉시 업데이트
            await prisma.$executeRaw`
              UPDATE users SET gold = ${newGold} WHERE id = ${userId}
            `;
            
            // 세션 gold_end도 동기화
            await prisma.$executeRaw`
              UPDATE investigation_sessions 
              SET gold_end = ${newGold}
              WHERE user_id = ${userId} AND status = 'active'
            `;
            
            delta.gold = result.value_change;
            console.log('골드 실시간 업데이트:', user.gold, '→', newGold, '(변화:', result.value_change, ')');
          }
        } else if (result.name === '체력') {
          // 세션에서 현재 HP 가져오기
          const session = await prisma.$queryRaw<any[]>`
            SELECT hp FROM investigation_sessions 
            WHERE user_id = ${userId} AND status = 'active'
            LIMIT 1
          `;
          
          const currentHp = session.length > 0 ? session[0].hp : 3;
          const newHp = Math.max(0, Math.min(3, currentHp + result.value_change));
          
          // 세션 HP 업데이트
          await prisma.$executeRaw`
            UPDATE investigation_sessions 
            SET hp = ${newHp}
            WHERE user_id = ${userId} AND status = 'active'
          `;
          
          delta.hp = result.value_change;
          console.log('체력 업데이트:', currentHp, '→', newHp, '(변화:', result.value_change, ')');
          
          // 체력이 0이 되면 조사 종료
          if (newHp <= 0) {
            delta.sessionEnded = true;
            delta.endReason = 'hp_depleted';
            await prisma.$executeRaw`
              UPDATE investigation_sessions 
              SET status = 'completed', ended_at = CURRENT_TIMESTAMP, hp = 0
              WHERE user_id = ${userId} AND status = 'active'
            `;
            console.log('체력 소진 - 조사 종료');
          }
        } else if (result.name === '정신력' || result.name === '에너지') {
          // 세션에서 현재 에너지 가져오기
          const session = await prisma.$queryRaw<any[]>`
            SELECT energy FROM investigation_sessions 
            WHERE user_id = ${userId} AND status = 'active'
            LIMIT 1
          `;
          
          const currentEnergy = session.length > 0 ? session[0].energy : 3;
          const newEnergy = Math.max(0, Math.min(3, currentEnergy + result.value_change));
          
          // 세션 에너지 업데이트
          await prisma.$executeRaw`
            UPDATE investigation_sessions 
            SET energy = ${newEnergy}
            WHERE user_id = ${userId} AND status = 'active'
          `;
          
          delta.energy = result.value_change;
          console.log('정신력 업데이트:', currentEnergy, '→', newEnergy, '(변화:', result.value_change, ')');
          
          // 정신력이 0이 되면 조사 종료
          if (newEnergy <= 0) {
            delta.sessionEnded = true;
            delta.endReason = 'energy_depleted';
            await prisma.$executeRaw`
              UPDATE investigation_sessions 
              SET status = 'completed', ended_at = CURRENT_TIMESTAMP, energy = 0
              WHERE user_id = ${userId} AND status = 'active'
            `;
            console.log('정신력 소진 - 조사 종료');
          }
        }
      } else {
        // SKILL, ITEM은 user_resources에 업데이트
        const userResources = await prisma.$queryRaw<any[]>`
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${result.resource_id}
        `;

        if (userResources.length > 0) {
          const newQuantity = userResources[0].quantity + result.value_change;
          await prisma.$executeRaw`
            UPDATE user_resources 
            SET quantity = ${newQuantity}
            WHERE user_id = ${userId} AND resource_id = ${result.resource_id}
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO user_resources (user_id, resource_id, quantity)
            VALUES (${userId}, ${result.resource_id}, ${result.value_change})
          `;
        }

        // delta에 추가 (알람용)
        if (result.type === 'ITEM') {
          if (!delta.items) delta.items = [];
          delta.items.push({
            name: result.name,
            qty: result.value_change
          });
        } else if (result.type === 'SKILL') {
          if (!delta.abilities) delta.abilities = [];
          delta.abilities.push({
            name: result.name,
            description: result.description || ''
          });
        }

        delta[result.name] = result.value_change;
      }
    }

    // 다음 노드 정보 조회
    const nextNodeId = choice.to_node_id;
    const nextNodes = await prisma.$queryRaw<any[]>`
      SELECT * FROM nodes WHERE id = ${nextNodeId}
    `;

    let nextNode = nextNodes[0];

    // 날짜 해금 규칙 (동일 규칙 재사용)
    const unlockRules: Record<number, string> = {
      29: '2025-10-09', 66: '2025-10-09', 122: '2025-10-09', 170: '2025-10-09', 219: '2025-10-09', 279: '2025-10-09',
      38: '2025-10-10', 84: '2025-10-10', 132: '2025-10-10', 186: '2025-10-10', 242: '2025-10-10', 288: '2025-10-10',
    };
    const formatDateForKR = (isoDate: string) => {
      const d = new Date(isoDate + 'T00:00:00');
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${month}월 ${day}일`;
    };

    // 날짜 해금 체크: 잠금이면 차단
    if (nextNode && unlockRules[nextNode.node_id]) {
      const unlockDateIso = unlockRules[nextNode.node_id];
      const today = new Date();
      if (today < new Date(unlockDateIso + 'T00:00:00')) {
        const whenKR = formatDateForKR(unlockDateIso);
        return res.status(400).json({ error: `${whenKR} 해금됩니다.` });
      }
    }

    // 랜덤 허브(500) 도착 시: DB에서 숫자로 시작하는 랜덤 노드 중 하나를 무작위로 선택
    if (nextNode && nextNode.node_id === 500) {
      const candidates = await prisma.$queryRaw<any[]>`
        SELECT id, node_id FROM nodes 
        WHERE node_type = 'random' 
          AND title ~ '^[0-9]'
      `;
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const picked = await prisma.$queryRaw<any[]>`
          SELECT * FROM nodes WHERE id = ${pick.id}
        `;
        if (picked.length > 0) {
          // 무작위 노드로 대체
          nextNode = picked[0];
          console.log(`랜덤 허브 500 → 무작위 랜덤 노드 ${nextNode.node_id}`);
        }
      } else {
        console.warn('랜덤 후보 없음: node_type=random AND title 숫자 시작');
      }
    }

    // 노드 4에 도착: 랜덤 능력 2개 부여 (튜토리얼이므로 중복 가능)
    if (nextNode && nextNode.node_id === 4) {
      console.log('노드 4 도착 - 랜덤 능력 부여 (중복 가능)');

      // 1~9번 능력만 조회
      const basicAbilities = await prisma.$queryRaw<any[]>`
        SELECT * FROM resources 
        WHERE type = 'SKILL' 
        AND name IN ('관찰력', '근력', '민첩함', '은신술', '손재주', '언변술', '매력', '직감', '권총')
        ORDER BY id
      `;

      // 랜덤으로 2개 선택
      const shuffled = [...basicAbilities].sort(() => 0.5 - Math.random());
      const selectedAbilities = shuffled.slice(0, 2);

      // 사용자에게 능력 부여 (이미 있으면 quantity 증가)
      for (const ability of selectedAbilities) {
        const existing = await prisma.$queryRaw<any[]>`
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${ability.id}
        `;

        if (existing.length > 0) {
          await prisma.$executeRaw`
            UPDATE user_resources 
            SET quantity = quantity + 1
            WHERE user_id = ${userId} AND resource_id = ${ability.id}
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO user_resources (user_id, resource_id, quantity)
            VALUES (${userId}, ${ability.id}, 1)
          `;
        }
      }

      // delta에 능력 정보 추가 (알람용)
      delta.abilities = selectedAbilities.map(a => ({
        name: a.name,
        description: a.description
      }));

      // 세션에 선택된 능력 저장 (조회 시 동일한 능력 표시용)
      const tempData = JSON.stringify({
        node4Abilities: selectedAbilities.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description
        }))
      });

      await prisma.$executeRaw`
        UPDATE investigation_sessions 
        SET current_node_id = 4, temp_data = ${tempData}
        WHERE user_id = ${userId} AND status = 'active'
      `;

      console.log('=== 노드 4 능력 부여 ===');
      console.log('선택된 능력:', selectedAbilities.map(a => a.name));
      console.log('세션에 저장됨');
      console.log('delta.abilities:', delta.abilities);
    }

    // 노드 5에 도착: 돈 +1
    if (nextNode && nextNode.node_id === 5) {
      console.log('노드 5 도착 - 돈 +1');

      // 사용자 테이블에서 현재 골드 가져오기
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const newGold = user.gold + 1;
        
        // 사용자 테이블에 즉시 업데이트
        await prisma.$executeRaw`
          UPDATE users SET gold = ${newGold} WHERE id = ${userId}
        `;
        
        // 세션 gold_end도 동기화
        await prisma.$executeRaw`
          UPDATE investigation_sessions 
          SET gold_end = ${newGold}
          WHERE user_id = ${userId} AND status = 'active'
        `;
        
        delta.gold = 1;
        console.log('골드 실시간 업데이트 (노드 5):', user.gold, '→', newGold);
      }
    }

    // 엔딩 노드 처리
    if (nextNode && nextNode.node_type === 'ending') {
      console.log(`엔딩 노드 ${nextNode.node_id} 도착`);
      
      // 세션 종료 전 최종 골드 가져오기
      const finalSession = await prisma.$queryRaw<any[]>`
        SELECT gold_end, gold_start FROM investigation_sessions 
        WHERE user_id = ${userId} AND status = 'active'
        LIMIT 1
      `;
      
      const finalGold = finalSession.length > 0 ? (finalSession[0].gold_end ?? finalSession[0].gold_start) : 0;
      
      delta.ending = {
        title: nextNode.title,
        message: '엔딩에 도달했습니다. 체크포인트에서 다시 시작할 수 있습니다.'
      };

      // 엔딩 도달 시 조사 세션 종료 및 최종 골드를 사용자 테이블에 반영
      await prisma.$executeRaw`
        UPDATE investigation_sessions 
        SET status = 'completed', ended_at = CURRENT_TIMESTAMP, hp = 0, energy = 0
        WHERE user_id = ${userId} AND status = 'active'
      `;
      
      // 최종 골드를 사용자 테이블에 반영
      await prisma.$executeRaw`
        UPDATE users SET gold = ${finalGold} WHERE id = ${userId}
      `;

      // 체력도 0으로 (조사 종료 표시)
      delta.sessionEnded = true;
      delta.endReason = 'ending';
      console.log('엔딩 도달 - 최종 골드 반영:', finalGold);
    }

    // 체크포인트 노드에 도착: 자동 저장
    if (nextNode && (nextNode.node_type === 'checkpoint')) {
      console.log(`체크포인트 노드 ${nextNode.node_id} 도착 - 저장`);

      // 현재 세션 정보 가져오기
      const session = await prisma.$queryRaw<any[]>`
        SELECT hp, energy, gold_end, gold_start FROM investigation_sessions 
        WHERE user_id = ${userId} AND status = 'active'
        LIMIT 1
      `;

      if (session.length > 0) {
        const currentGold = session[0].gold_end ?? session[0].gold_start;
        const currentHp = session[0].hp;
        const currentEnergy = session[0].energy;

        // 이미 이 체크포인트가 있는지 확인
        const existing = await prisma.$queryRaw<any[]>`
          SELECT * FROM user_checkpoints 
          WHERE user_id = ${userId} AND node_id = ${nextNode.node_id}
        `;

        if (existing.length === 0) {
          // 체크포인트 정보 조회 (스토리에 정의된 제목)
          const checkpointInfo = await prisma.$queryRaw<any[]>`
            SELECT checkpoint_name, description 
            FROM checkpoints 
            WHERE node_id = ${nextNode.id}
          `;

          let checkpointTitle = nextNode.title || `체크포인트 ${nextNode.node_id}`;
          let checkpointDesc = nextNode.text_content.substring(0, 100);

          if (checkpointInfo.length > 0) {
            checkpointTitle = checkpointInfo[0].checkpoint_name;
            checkpointDesc = checkpointInfo[0].description || checkpointDesc;
          }

          // 세션의 현재 상태로 체크포인트 저장
          await prisma.$executeRaw`
            INSERT INTO user_checkpoints (user_id, node_id, title, description, hp, energy, gold)
            VALUES (
              ${userId}, 
              ${nextNode.node_id}, 
              ${checkpointTitle},
              ${checkpointDesc},
              ${currentHp},
              ${currentEnergy},
              ${currentGold}
            )
          `;

          delta.checkpoint = {
            title: checkpointTitle,
            message: '체크포인트 도달! 진행 상황이 저장되었습니다.'
          };

          console.log(`체크포인트 저장 완료: ${checkpointTitle} (HP:${currentHp}, Energy:${currentEnergy}, Gold:${currentGold})`);
        } else {
          console.log('이미 저장된 체크포인트입니다.');
        }
      }
    }

    // 다음 노드 데이터 구성
    let nextNodeData = null;
    if (nextNode) {
      let nextNodeText = nextNode.text_content;

      // 노드 5: 돈 텍스트 표시
      if (nextNode.node_id === 5) {
        nextNodeText = nextNode.text_content + '\n(돈 +1)';
      }

      // 노드 4: 방금 받은 능력 텍스트 표시
      if (nextNode.node_id === 4 && delta.abilities) {
        console.log('=== 노드 4 텍스트 생성 ===');
        console.log('delta.abilities:', JSON.stringify(delta.abilities, null, 2));
        
        const abilityText = delta.abilities.map((a: any) => 
          `+ ${a.name}\n${a.description}`
        ).join('\n\n');
        
        nextNodeText = `당신이 가진 능력이 깨어났습니다...\n\n이제 얻은 능력\n\n${abilityText}`;
        
        console.log('생성된 텍스트:', nextNodeText);
      }

      // 다음 노드의 선택지도 함께 조회
      const nextChoices = await prisma.$queryRaw<any[]>`
        SELECT c.*, n.node_id as target_node_number
        FROM choices c
        JOIN nodes n ON c.to_node_id = n.id
        WHERE c.from_node_id = ${nextNode.id}
        ORDER BY c.order_num ASC
      `;

      const nextChoicesFormatted = nextChoices.map(c => ({
        id: c.id,
        targetNodeId: c.target_node_number,
        label: c.choice_text,
        available: c.is_available
      }));

      nextNodeData = {
        nodeId: nextNode.node_id,
        title: nextNode.title,
        text: nextNodeText,
        imageUrl: nextNode.image_url, // 이미지 URL 전달
        nodeType: nextNode.node_type,
        choices: nextChoicesFormatted
      };
    }

    // 최신 세션 정보 조회 (엔딩/조사종료 후에는 completed 상태일 수 있음)
    const updatedSession = await prisma.$queryRaw<any[]>`
      SELECT hp, energy, gold_start, gold_end FROM investigation_sessions 
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    // 사용자 테이블에서 현재 골드 가져오기
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    const sessionInfo = updatedSession.length > 0 ? {
      hp: updatedSession[0].hp,
      energy: updatedSession[0].energy,
      gold: currentUser ? currentUser.gold : (updatedSession[0].gold_end ?? updatedSession[0].gold_start)
    } : null;

    return res.status(200).json({
      success: true,
      delta,
      nodeId: nextNode ? nextNode.node_id : null,
      nextNode: nextNodeData,
      session: sessionInfo
    });

  } catch (error) {
    console.error('선택지 선택 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 사용자 자원 조회
export const getUserResources = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const resources = await prisma.$queryRaw<any[]>`
      SELECT ur.*, r.name, r.description, r.type
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId}
      ORDER BY r.type, r.name
    `;

    return res.status(200).json({ resources });

  } catch (error) {
    console.error('사용자 자원 조회 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 임시로 사용하지 않는 함수들 (501 응답)
export const getActionPointStatus = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 investigation 시스템으로 이전되었습니다.' });
};

export const getStoryProgress = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 investigation 시스템으로 이전되었습니다.' });
};

export const autosaveStory = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};

export const enterStoryDay = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};

export const completeRandomStoriesAndSaveCheckpoint = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};

export const completeRandomStoriesAndReturnToCheckpoint = async (req: Request, res: Response) => {
  return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};