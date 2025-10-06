"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBossAoeInfo = exports.getBossData = void 0;
const prisma_1 = require("../lib/prisma");
const getBossData = async (req, res) => {
    try {
        const { bossId } = req.params;
        const bossIdNum = parseInt(bossId);
        if (isNaN(bossIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 보스 ID입니다.' });
        }
        const boss = await prisma_1.prisma.boss.findUnique({
            where: { id: bossIdNum }
        });
        if (!boss) {
            return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
        }
        const aoePatterns = {
            1: { turns: [3, 6, 9, 12] },
            2: { turns: [4, 8, 12, 16] },
            3: { turns: [2, 5, 8, 11, 14] }
        };
        const formattedBoss = {
            id: boss.id,
            name: boss.name,
            hp: boss.hp,
            skills: typeof boss.skills === 'string' ? JSON.parse(boss.skills) : boss.skills,
            aoePattern: aoePatterns[boss.id] || { turns: [] }
        };
        return res.status(200).json(formattedBoss);
    }
    catch (error) {
        console.error('Get boss data error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getBossData = getBossData;
const getBossAoeInfo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const raidTeam = await prisma_1.prisma.raidTeam.findUnique({
            where: { id: teamIdNum },
            include: {
                team_members: true,
                boss: true
            }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
        }
        const isMember = raidTeam.team_members.some((member) => member.user_id === userId);
        if (!isMember) {
            return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
        }
        const aoePatterns = {
            1: { turns: [3, 6, 9, 12] },
            2: { turns: [4, 8, 12, 16] },
            3: { turns: [2, 5, 8, 11, 14] }
        };
        const pattern = aoePatterns[raidTeam.boss.id] || { turns: [] };
        const battleStates = require('./battleController').battleStates || {};
        const battle = battleStates[teamIdNum];
        const currentTurn = battle?.turn || 1;
        const nextAoeTurn = pattern.turns.find(turn => turn > currentTurn);
        return res.status(200).json({
            nextAoeTurn: nextAoeTurn || null,
            canNegateWith: 'IGNORE_DAMAGE',
            aoePattern: pattern,
            currentTurn: currentTurn
        });
    }
    catch (error) {
        console.error('Get boss AOE info error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getBossAoeInfo = getBossAoeInfo;
//# sourceMappingURL=bossController.js.map