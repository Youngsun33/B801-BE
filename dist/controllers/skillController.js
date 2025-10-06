"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAoeAlly = exports.useHeal = exports.useIgnoreDamage = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const ignoreDamageSchema = zod_1.z.object({
    appliesTo: zod_1.z.enum(['boss_aoe']),
    turn: zod_1.z.number().min(1)
});
const healSchema = zod_1.z.object({
    targetUserId: zod_1.z.number(),
    amount: zod_1.z.number().min(1).max(200).optional().default(50)
});
const aoeAllySchema = zod_1.z.object({
    cardId: zod_1.z.string()
});
const getBattleState = (teamId) => {
    const battleStates = require('./battleController').battleStates || {};
    return battleStates[teamId];
};
const useIgnoreDamage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { appliesTo, turn } = ignoreDamageSchema.parse(req.body);
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
        const battle = getBattleState(teamIdNum);
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (appliesTo === 'boss_aoe') {
            battle.activeBuffs.push({
                id: 'IGNORE_AOE_DAMAGE',
                duration: 1,
                effect: { ignoreBossAoe: true, targetTurn: turn }
            });
            return res.status(200).json({
                message: `${turn}턴 보스 광역 공격 피해를 무시합니다.`,
                appliesTo: appliesTo,
                turn: turn
            });
        }
        return res.status(400).json({ error: '지원하지 않는 피해 무시 타입입니다.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Use ignore damage error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useIgnoreDamage = useIgnoreDamage;
const useHeal = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { targetUserId, amount } = healSchema.parse(req.body);
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
        const isTargetMember = raidTeam.team_members.some((member) => member.user_id === targetUserId);
        if (!isTargetMember) {
            return res.status(400).json({ error: '대상이 팀원이 아닙니다.' });
        }
        const battle = getBattleState(teamIdNum);
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (battle.phase !== 'select') {
            return res.status(409).json({ error: '카드 선택 페이즈에서만 힐을 사용할 수 있습니다.' });
        }
        const target = battle.teamMembers.find((member) => member.userId === targetUserId);
        if (!target) {
            return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });
        }
        if (target.hp <= 0) {
            return res.status(409).json({ error: '사망한 대상은 치료할 수 없습니다.' });
        }
        const healAmount = Math.min(amount, target.maxHp - target.hp);
        target.hp += healAmount;
        battle.playerSelections[userId] = {
            cardId: 'heal_action',
            targetUserId: targetUserId,
            locked: true
        };
        return res.status(200).json({
            message: `${healAmount}만큼 치료했습니다.`,
            targetUserId: targetUserId,
            healAmount: healAmount,
            targetHpAfter: target.hp,
            cannotAttackThisTurn: true
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Use heal error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useHeal = useHeal;
const useAoeAlly = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { cardId } = aoeAllySchema.parse(req.body);
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
        const battle = getBattleState(teamIdNum);
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (battle.phase !== 'select') {
            return res.status(409).json({ error: '카드 선택 페이즈에서만 사용할 수 있습니다.' });
        }
        const CARD_CATALOG = require('./battleController').CARD_CATALOG;
        const card = CARD_CATALOG.ally.find((c) => c.id === cardId);
        if (!card || card.type !== 'attack') {
            return res.status(400).json({ error: '유효하지 않은 공격 카드입니다.' });
        }
        const baseDamage = card.effects[0].damage || 10;
        const distributedDamage = Math.floor(baseDamage * 0.5);
        const aliveMembers = battle.teamMembers.filter((member) => member.hp > 0);
        const totalDamage = distributedDamage * aliveMembers.length;
        battle.bossHp = Math.max(0, battle.bossHp - totalDamage);
        battle.stunGauge.value += totalDamage;
        battle.playerSelections[userId] = {
            cardId: cardId,
            locked: true
        };
        return res.status(200).json({
            message: '아군 광역 공격을 사용했습니다.',
            cardId: cardId,
            participatingMembers: aliveMembers.length,
            distributedDamage: distributedDamage,
            totalDamage: totalDamage,
            bossHpRemaining: battle.bossHp
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Use AOE ally error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useAoeAlly = useAoeAlly;
//# sourceMappingURL=skillController.js.map