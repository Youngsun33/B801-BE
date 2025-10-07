"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemainingInvestigations = exports.enterStoryDay = exports.endInvestigation = exports.updateSessionStats = exports.getCurrentSession = exports.startInvestigation = void 0;
const prisma_1 = require("../lib/prisma");
const startInvestigation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }
        const currentDay = user.current_day;
        let dailyCount = await prisma_1.prisma.$queryRaw `
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;
        if (dailyCount.length === 0) {
            await prisma_1.prisma.$executeRaw `
        INSERT INTO daily_investigation_count (user_id, day, count)
        VALUES (${userId}, ${currentDay}, 0)
      `;
            dailyCount = await prisma_1.prisma.$queryRaw `
        SELECT * FROM daily_investigation_count 
        WHERE user_id = ${userId} AND day = ${currentDay}
      `;
        }
        const investigationCount = dailyCount[0].count;
        if (investigationCount >= 3) {
            return res.status(400).json({
                error: '오늘의 조사 기회를 모두 사용했습니다.',
                remainingInvestigations: 0,
                currentDay
            });
        }
        const activeSessions = await prisma_1.prisma.$queryRaw `
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        if (activeSessions.length > 0) {
            return res.json({
                message: '진행 중인 조사가 있습니다.',
                session: activeSessions[0],
                remainingInvestigations: 3 - investigationCount
            });
        }
        await prisma_1.prisma.$executeRaw `
      INSERT INTO investigation_sessions 
      (user_id, day, session_number, hp, energy, gold_start, current_node_id, status)
      VALUES (${userId}, ${currentDay}, ${investigationCount + 1}, 3, 3, ${user.gold}, 1, 'active')
    `;
        console.log('새 조사 세션 시작 - 노드 1부터');
        await prisma_1.prisma.$executeRaw `
      UPDATE daily_investigation_count 
      SET count = ${investigationCount + 1}
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;
        const newSession = await prisma_1.prisma.$queryRaw `
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
    }
    catch (error) {
        console.error('조사 시작 오류:', error);
        return res.status(500).json({ error: '조사 시작 중 오류가 발생했습니다.' });
    }
};
exports.startInvestigation = startInvestigation;
const getCurrentSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const activeSessions = await prisma_1.prisma.$queryRaw `
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        if (activeSessions.length === 0) {
            return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
        }
        return res.json({ session: activeSessions[0] });
    }
    catch (error) {
        console.error('세션 조회 오류:', error);
        return res.status(500).json({ error: '세션 조회 중 오류가 발생했습니다.' });
    }
};
exports.getCurrentSession = getCurrentSession;
const updateSessionStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { hp, energy, gold } = req.body;
        const activeSessions = await prisma_1.prisma.$queryRaw `
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        if (activeSessions.length === 0) {
            return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
        }
        const session = activeSessions[0];
        const shouldEnd = hp <= 0 || energy <= 0;
        if (shouldEnd) {
            await prisma_1.prisma.$executeRaw `
        UPDATE investigation_sessions 
        SET hp = ${hp}, energy = ${energy}, gold_end = ${gold}, 
            status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ${session.id}
      `;
            await prisma_1.prisma.$executeRaw `
        UPDATE users 
        SET hp = ${hp}, energy = ${energy}, gold = ${gold}
        WHERE id = ${userId}
      `;
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
        await prisma_1.prisma.$executeRaw `
      UPDATE investigation_sessions 
      SET hp = ${hp}, energy = ${energy}, gold_end = ${gold}
      WHERE id = ${session.id}
    `;
        await prisma_1.prisma.$executeRaw `
      UPDATE users 
      SET hp = ${hp}, energy = ${energy}, gold = ${gold}
      WHERE id = ${userId}
    `;
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
    }
    catch (error) {
        console.error('스탯 업데이트 오류:', error);
        return res.status(500).json({ error: '스탯 업데이트 중 오류가 발생했습니다.' });
    }
};
exports.updateSessionStats = updateSessionStats;
const endInvestigation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const activeSessions = await prisma_1.prisma.$queryRaw `
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        if (activeSessions.length === 0) {
            return res.status(404).json({ error: '진행 중인 조사가 없습니다.' });
        }
        const session = activeSessions[0];
        await prisma_1.prisma.$executeRaw `
      UPDATE investigation_sessions 
      SET status = 'completed', ended_at = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
    `;
        const finalHp = session.hp !== null ? session.hp : 3;
        const finalEnergy = session.energy !== null ? session.energy : 3;
        const finalGold = session.gold_end !== null ? session.gold_end : session.gold_start;
        await prisma_1.prisma.$executeRaw `
      UPDATE users 
      SET hp = ${finalHp}, energy = ${finalEnergy}, gold = ${finalGold}
      WHERE id = ${userId}
    `;
        return res.json({
            message: '조사를 종료했습니다.',
            session: {
                ...session,
                status: 'completed'
            }
        });
    }
    catch (error) {
        console.error('조사 종료 오류:', error);
        return res.status(500).json({ error: '조사 종료 중 오류가 발생했습니다.' });
    }
};
exports.endInvestigation = endInvestigation;
const enterStoryDay = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { day } = req.params;
        console.log(`게임 시작 요청: Day ${day}, User ${userId}`);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }
        const currentDay = user.current_day;
        let dailyCount = await prisma_1.prisma.$queryRaw `
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;
        if (dailyCount.length === 0) {
            await prisma_1.prisma.$executeRaw `
        INSERT INTO daily_investigation_count (user_id, day, count)
        VALUES (${userId}, ${currentDay}, 0)
      `;
            dailyCount = await prisma_1.prisma.$queryRaw `
        SELECT * FROM daily_investigation_count 
        WHERE user_id = ${userId} AND day = ${currentDay}
      `;
        }
        const investigationCount = dailyCount[0].count;
        if (investigationCount >= 3) {
            return res.status(400).json({
                error: '오늘의 조사 기회를 모두 사용했습니다.',
                remainingInvestigations: 0,
                currentDay
            });
        }
        const activeSessions = await prisma_1.prisma.$queryRaw `
      SELECT * FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        if (activeSessions.length > 0) {
            console.log('기존 활성 세션 종료하고 새로 시작');
            await prisma_1.prisma.$executeRaw `
        UPDATE investigation_sessions 
        SET status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ${activeSessions[0].id}
      `;
        }
        await prisma_1.prisma.$executeRaw `
      INSERT INTO investigation_sessions 
      (user_id, day, session_number, hp, energy, gold_start, current_node_id, status)
      VALUES (${userId}, ${currentDay}, ${investigationCount + 1}, 3, 3, ${user.gold}, 1, 'active')
    `;
        console.log('새 조사 세션 시작 - 노드 1부터');
        await prisma_1.prisma.$executeRaw `
      UPDATE daily_investigation_count 
      SET count = ${investigationCount + 1}
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;
        const startNodes = await prisma_1.prisma.$queryRaw `
      SELECT * FROM nodes WHERE story_id = 1 AND node_id = 1 LIMIT 1
    `;
        let startNodeData = null;
        if (startNodes.length > 0) {
            const node = startNodes[0];
            const choices = await prisma_1.prisma.$queryRaw `
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
                choices: choices.map((c) => ({
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
    }
    catch (error) {
        console.error('게임 시작 오류:', error);
        return res.status(500).json({ error: '게임 시작 중 오류가 발생했습니다.' });
    }
};
exports.enterStoryDay = enterStoryDay;
const getRemainingInvestigations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }
        const currentDay = user.current_day;
        const dailyCount = await prisma_1.prisma.$queryRaw `
      SELECT * FROM daily_investigation_count 
      WHERE user_id = ${userId} AND day = ${currentDay}
    `;
        const investigationCount = dailyCount.length > 0 ? dailyCount[0].count : 0;
        const remaining = 3 - investigationCount;
        return res.json({
            current: remaining,
            max: 3,
            nextRechargeAtIso: null
        });
    }
    catch (error) {
        console.error('조사 횟수 확인 오류:', error);
        return res.status(500).json({ error: '조사 횟수 확인 중 오류가 발생했습니다.' });
    }
};
exports.getRemainingInvestigations = getRemainingInvestigations;
//# sourceMappingURL=investigationController.js.map