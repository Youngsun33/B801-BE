"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeTeamItems = exports.useTeamItem = exports.getTeamItems = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const useItemSchema = zod_1.z.object({
    teamItemId: zod_1.z.number().min(1),
    consume: zod_1.z.number().min(1).max(10)
});
const ITEM_EFFECTS = {
    5: {
        type: 'damage_boost',
        value: 20,
        duration: 3,
        description: '3턴 동안 공격력 20% 증가'
    },
    6: {
        type: 'shield',
        value: 50,
        duration: 1,
        description: '모든 팀원에게 50의 방어막 제공'
    }
};
const getTeamItems = async (req, res) => {
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
            return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
        }
        const formattedItems = raidTeam.raid_items.map((raidItem) => ({
            teamItemId: raidItem.id,
            quantity: raidItem.quantity,
            item: {
                ...raidItem.item,
                effect: ITEM_EFFECTS[raidItem.item.id] || null
            }
        }));
        return res.status(200).json({
            teamId: raidTeam.id,
            items: formattedItems
        });
    }
    catch (error) {
        console.error('Get team items error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getTeamItems = getTeamItems;
const useTeamItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { teamItemId, consume } = useItemSchema.parse(req.body);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const raidTeam = await prisma_1.prisma.raidTeam.findUnique({
            where: { id: teamIdNum },
            include: {
                team_members: true
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
        if (!battle) {
            return res.status(409).json({ error: '전투 중이 아닙니다.' });
        }
        if (battle.phase === 'finished') {
            return res.status(409).json({ error: '전투가 종료되었습니다.' });
        }
        const teamItem = await prisma_1.prisma.raidItem.findUnique({
            where: { id: teamItemId },
            include: {
                item: true
            }
        });
        if (!teamItem || teamItem.team_id !== teamIdNum) {
            return res.status(404).json({ error: '팀 아이템을 찾을 수 없습니다.' });
        }
        if (teamItem.quantity < consume) {
            return res.status(409).json({
                error: '아이템이 부족합니다.',
                available: teamItem.quantity,
                requested: consume
            });
        }
        const itemEffect = ITEM_EFFECTS[teamItem.item.id];
        if (!itemEffect) {
            return res.status(400).json({ error: '지원하지 않는 아이템입니다.' });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            if (teamItem.quantity === consume) {
                await tx.raidItem.delete({
                    where: { id: teamItemId }
                });
            }
            else {
                await tx.raidItem.update({
                    where: { id: teamItemId },
                    data: { quantity: teamItem.quantity - consume }
                });
            }
        });
        for (let i = 0; i < consume; i++) {
            if (itemEffect.type === 'damage_boost') {
                battle.activeBuffs.push({
                    id: `ITEM_DAMAGE_BOOST_${Date.now()}_${i}`,
                    duration: itemEffect.duration,
                    effect: {
                        damageMultiplier: 1 + (itemEffect.value / 100),
                        source: 'item',
                        itemName: teamItem.item.name
                    }
                });
            }
            else if (itemEffect.type === 'shield') {
                battle.teamMembers.forEach((member) => {
                    if (member.hp > 0) {
                        member.shield += itemEffect.value;
                    }
                });
            }
        }
        return res.status(200).json({
            message: `${teamItem.item.name} ${consume}개를 사용했습니다.`,
            itemName: teamItem.item.name,
            consumed: consume,
            effect: itemEffect.description,
            remainingQuantity: Math.max(0, teamItem.quantity - consume)
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Use team item error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useTeamItem = useTeamItem;
const purgeTeamItems = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const raidTeam = await prisma_1.prisma.raidTeam.findUnique({
            where: { id: teamIdNum }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
        }
        await prisma_1.prisma.raidItem.deleteMany({
            where: { team_id: teamIdNum }
        });
        console.log(`🗑️  팀 ${teamIdNum}의 모든 레이드 아이템이 소멸되었습니다.`);
        return res.status(204).send();
    }
    catch (error) {
        console.error('Purge team items error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.purgeTeamItems = purgeTeamItems;
//# sourceMappingURL=teamItemController.js.map