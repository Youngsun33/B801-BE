"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamStatus = exports.getTeamDetails = exports.getMyTeam = exports.leaveRaidQueue = exports.joinRaidQueue = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const queueJoinSchema = zod_1.z.object({
    day: zod_1.z.number().min(1).max(3)
});
const queueLeaveSchema = zod_1.z.object({
    day: zod_1.z.number().min(1).max(3)
});
const teamQuerySchema = zod_1.z.object({
    day: zod_1.z.string().transform(val => parseInt(val))
});
const teamStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ongoing', 'cleared', 'failed'])
});
const isRaidPhase = () => {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 18 && currentHour < 21;
};
const raidQueues = {
    1: [],
    2: [],
    3: []
};
const TEAM_SIZE = 4;
const tryAutoMatch = async (day) => {
    const queue = raidQueues[day];
    if (queue.length >= TEAM_SIZE) {
        queue.sort((a, b) => b.attack_power - a.attack_power);
        const team = queue.splice(0, TEAM_SIZE);
        try {
            const bossId = day;
            const raidTeam = await prisma_1.prisma.raidTeam.create({
                data: {
                    day: day,
                    status: 'ongoing',
                    boss_id: bossId
                }
            });
            const teamMembers = await Promise.all(team.map(member => prisma_1.prisma.teamMember.create({
                data: {
                    team_id: raidTeam.id,
                    user_id: member.userId
                }
            })));
            console.log(`🎯 레이드 팀 ${raidTeam.id} 생성됨 (${day}일차, ${team.length}명)`);
            return raidTeam;
        }
        catch (error) {
            console.error('Auto match error:', error);
            queue.unshift(...team);
            return null;
        }
    }
    return null;
};
const joinRaidQueue = async (req, res) => {
    try {
        if (!isRaidPhase()) {
            return res.status(409).json({ error: '레이드 페이즈가 아닙니다.' });
        }
        const userId = req.user.userId;
        const { day } = queueJoinSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                attack_power: true,
                is_alive: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        if (!user.is_alive) {
            return res.status(409).json({ error: '사망한 상태에서는 레이드에 참여할 수 없습니다.' });
        }
        const existingTeam = await prisma_1.prisma.raidTeam.findFirst({
            where: {
                day: day,
                team_members: {
                    some: { user_id: userId }
                }
            }
        });
        if (existingTeam) {
            return res.status(409).json({ error: '이미 해당 일차의 레이드 팀에 속해있습니다.' });
        }
        const queue = raidQueues[day];
        const alreadyInQueue = queue.find(member => member.userId === userId);
        if (alreadyInQueue) {
            return res.status(409).json({ error: '이미 레이드 대기열에 참여중입니다.' });
        }
        queue.push({
            userId: user.id,
            username: user.username,
            attack_power: user.attack_power,
            joinedAt: new Date()
        });
        console.log(`👥 ${user.username} 레이드 대기열 참여 (${day}일차, 대기: ${queue.length}명)`);
        const matchedTeam = await tryAutoMatch(day);
        return res.status(202).json({
            message: '레이드 대기열에 참여했습니다.',
            queuePosition: queue.findIndex(member => member.userId === userId) + 1,
            queueSize: queue.length,
            matched: !!matchedTeam,
            teamId: matchedTeam?.id
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Join raid queue error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.joinRaidQueue = joinRaidQueue;
const leaveRaidQueue = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { day } = queueLeaveSchema.parse(req.body);
        const queue = raidQueues[day];
        const memberIndex = queue.findIndex(member => member.userId === userId);
        if (memberIndex === -1) {
            return res.status(409).json({ error: '레이드 대기열에 참여하지 않았습니다.' });
        }
        const removedMember = queue.splice(memberIndex, 1)[0];
        console.log(`👋 ${removedMember.username} 레이드 대기열 이탈 (${day}일차)`);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Leave raid queue error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.leaveRaidQueue = leaveRaidQueue;
const getMyTeam = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { day } = teamQuerySchema.parse(req.query);
        if (isNaN(day) || day < 1 || day > 3) {
            return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
        }
        const raidTeam = await prisma_1.prisma.raidTeam.findFirst({
            where: {
                day: day,
                team_members: {
                    some: { user_id: userId }
                }
            },
            include: {
                boss: {
                    select: {
                        id: true,
                        name: true,
                        hp: true
                    }
                },
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
                }
            }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '해당 일차의 레이드 팀을 찾을 수 없습니다.' });
        }
        const formattedTeam = {
            team: {
                id: raidTeam.id,
                day: raidTeam.day,
                status: raidTeam.status,
                boss: raidTeam.boss
            },
            members: raidTeam.team_members.map((member) => ({
                userId: member.user.id,
                username: member.user.username,
                attack_power: member.user.attack_power,
                is_alive: member.user.is_alive
            }))
        };
        return res.status(200).json(formattedTeam);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get my team error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getMyTeam = getMyTeam;
const getTeamDetails = async (req, res) => {
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
                boss: {
                    select: {
                        id: true,
                        name: true,
                        hp: true,
                        skills: true
                    }
                },
                team_members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                attack_power: true,
                                hp: true,
                                energy: true,
                                is_alive: true
                            }
                        }
                    }
                },
                raid_items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                type: true
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
            return res.status(403).json({ error: '팀원만 조회할 수 있습니다.' });
        }
        const formattedTeam = {
            team: {
                id: raidTeam.id,
                day: raidTeam.day,
                status: raidTeam.status,
                boss: {
                    ...raidTeam.boss,
                    skills: typeof raidTeam.boss.skills === 'string'
                        ? JSON.parse(raidTeam.boss.skills)
                        : raidTeam.boss.skills
                }
            },
            members: raidTeam.team_members.map((member) => ({
                userId: member.user.id,
                username: member.user.username,
                attack_power: member.user.attack_power,
                hp: member.user.hp,
                energy: member.user.energy,
                is_alive: member.user.is_alive
            })),
            raid_items: raidTeam.raid_items.map((raidItem) => ({
                raidItemId: raidItem.id,
                quantity: raidItem.quantity,
                item: raidItem.item
            }))
        };
        return res.status(200).json(formattedTeam);
    }
    catch (error) {
        console.error('Get team details error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getTeamDetails = getTeamDetails;
const updateTeamStatus = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { status } = teamStatusSchema.parse(req.body);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const raidTeam = await prisma_1.prisma.raidTeam.findUnique({
            where: { id: teamIdNum }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
        }
        await prisma_1.prisma.raidTeam.update({
            where: { id: teamIdNum },
            data: { status }
        });
        console.log(`🏆 레이드 팀 ${teamIdNum} 상태 변경: ${raidTeam.status} -> ${status}`);
        return res.status(200).json({
            message: '팀 상태가 업데이트되었습니다.',
            teamId: teamIdNum,
            status: status
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Update team status error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.updateTeamStatus = updateTeamStatus;
//# sourceMappingURL=raidController.js.map