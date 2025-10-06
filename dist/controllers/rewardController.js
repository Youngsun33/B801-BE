"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDayLeaderboard = exports.getContribution = exports.getRaidResult = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const leaderboardQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['damage', 'clearTime']).optional().default('damage')
});
const getRaidResult = async (req, res) => {
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
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                attack_power: true,
                                is_alive: true
                            }
                        }
                    }
                },
                boss: {
                    select: {
                        id: true,
                        name: true,
                        hp: true
                    }
                }
            }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
        }
        const isMember = raidTeam.team_members.some((member) => member.user_id === userId);
        if (!isMember) {
            return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
        }
        const battleStates = require('./battleController').battleStates || {};
        const battle = battleStates[teamIdNum];
        let totalDamageDealt = 0;
        let clearTime = null;
        let rewards = {};
        if (battle && battle.battleLogs) {
            battle.battleLogs.forEach((log) => {
                log.events.forEach((event) => {
                    if (event.type === 'player_attack' && event.damage) {
                        totalDamageDealt += event.damage;
                    }
                });
            });
            if (raidTeam.status === 'cleared') {
                clearTime = battle.battleLogs.length;
                const baseGoldReward = 100 * raidTeam.day;
                const timeBonus = Math.max(0, 50 - (clearTime * 5));
                rewards = {
                    gold: baseGoldReward + timeBonus,
                    experience: 50 * raidTeam.day,
                    items: clearTime <= 10 ? [
                        { itemId: 1, name: '치료 포션', quantity: 2 },
                        { itemId: 2, name: '에너지 드링크', quantity: 1 }
                    ] : [
                        { itemId: 1, name: '치료 포션', quantity: 1 }
                    ]
                };
            }
        }
        const result = {
            teamId: raidTeam.id,
            day: raidTeam.day,
            status: raidTeam.status,
            boss: {
                name: raidTeam.boss.name,
                maxHp: raidTeam.boss.hp,
                remainingHp: battle?.bossHp || 0
            },
            team: raidTeam.team_members.map((member) => ({
                userId: member.user.id,
                username: member.user.username,
                isAlive: member.user.is_alive
            })),
            stats: {
                totalDamageDealt: totalDamageDealt,
                clearTime: clearTime,
                turnsPlayed: battle?.battleLogs?.length || 0
            },
            rewards: raidTeam.status === 'cleared' ? rewards : null,
            timestamp: new Date().toISOString()
        };
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Get raid result error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getRaidResult = getRaidResult;
const getContribution = async (req, res) => {
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
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                }
            }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
        }
        const isMember = raidTeam.team_members.some((member) => member.user_id === userId);
        if (!isMember) {
            return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
        }
        const battleStates = require('./battleController').battleStates || {};
        const battle = battleStates[teamIdNum];
        const contributions = {};
        raidTeam.team_members.forEach((member) => {
            contributions[member.user.id] = {
                userId: member.user.id,
                username: member.user.username,
                damage: 0,
                heals: 0,
                buffsUsed: 0,
                cardsPlayed: 0
            };
        });
        if (battle && battle.battleLogs) {
            battle.battleLogs.forEach((log) => {
                log.events.forEach((event) => {
                    const contrib = contributions[event.userId];
                    if (!contrib)
                        return;
                    switch (event.type) {
                        case 'player_attack':
                            contrib.damage += event.damage || 0;
                            contrib.cardsPlayed += 1;
                            break;
                        case 'heal':
                            contrib.heals += event.amount || 0;
                            contrib.cardsPlayed += 1;
                            break;
                        case 'buff_used':
                            contrib.buffsUsed += 1;
                            break;
                    }
                });
            });
        }
        return res.status(200).json({
            teamId: raidTeam.id,
            contributions: Object.values(contributions)
        });
    }
    catch (error) {
        console.error('Get contribution error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getContribution = getContribution;
const getDayLeaderboard = async (req, res) => {
    try {
        const { day } = req.params;
        const dayNum = parseInt(day);
        const { type } = leaderboardQuerySchema.parse(req.query);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
            return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
        }
        const raidTeams = await prisma_1.prisma.raidTeam.findMany({
            where: {
                day: dayNum,
                status: 'cleared'
            },
            include: {
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                },
                boss: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const battleStates = require('./battleController').battleStates || {};
        const leaderboardData = raidTeams.map(team => {
            const battle = battleStates[team.id];
            let totalDamage = 0;
            let clearTime = battle?.battleLogs?.length || 999;
            if (battle && battle.battleLogs) {
                battle.battleLogs.forEach((log) => {
                    log.events.forEach((event) => {
                        if (event.type === 'player_attack' && event.damage) {
                            totalDamage += event.damage;
                        }
                    });
                });
            }
            return {
                teamId: team.id,
                day: team.day,
                bossName: team.boss.name,
                members: team.team_members.map((member) => member.user.username),
                totalDamage: totalDamage,
                clearTime: clearTime,
                status: team.status
            };
        });
        if (type === 'damage') {
            leaderboardData.sort((a, b) => b.totalDamage - a.totalDamage);
        }
        else if (type === 'clearTime') {
            leaderboardData.sort((a, b) => a.clearTime - b.clearTime);
        }
        const rankedData = leaderboardData.map((team, index) => ({
            rank: index + 1,
            ...team
        }));
        return res.status(200).json({
            day: dayNum,
            type: type,
            leaderboard: rankedData.slice(0, 50)
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get day leaderboard error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getDayLeaderboard = getDayLeaderboard;
//# sourceMappingURL=rewardController.js.map