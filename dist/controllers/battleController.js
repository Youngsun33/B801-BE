"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStunGauge = exports.useBuff = exports.getBattleLogs = exports.resolveTurn = exports.unlockCard = exports.lockCard = exports.getBattleState = exports.getCardCatalog = exports.battleStates = exports.CARD_CATALOG = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const cardQuerySchema = zod_1.z.object({
    role: zod_1.z.enum(['ally', 'boss']).optional()
});
const lockCardSchema = zod_1.z.object({
    cardId: zod_1.z.string(),
    targetUserId: zod_1.z.number().optional()
});
const useBuffSchema = zod_1.z.object({
    buffId: zod_1.z.enum(['TEAM_DMG_UP_20'])
});
const ignoreDamageSchema = zod_1.z.object({
    appliesTo: zod_1.z.enum(['boss_aoe']),
    turn: zod_1.z.number().min(1)
});
const healSchema = zod_1.z.object({
    targetUserId: zod_1.z.number(),
    amount: zod_1.z.number().min(1).max(200).optional()
});
const aoeAllySchema = zod_1.z.object({
    cardId: zod_1.z.string()
});
const battleLogsQuerySchema = zod_1.z.object({
    fromTurn: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1)
});
exports.CARD_CATALOG = {
    ally: [
        {
            id: 'basic_attack',
            name: '기본 공격',
            type: 'attack',
            description: '기본적인 물리 공격',
            effects: [
                { probability: 0.7, damage: 10, name: '일반 공격' },
                { probability: 0.1, damage: 13, name: '치명타' },
                { probability: 0.1, damage: 2, name: '약공' },
                { probability: 0.05, damage: 20, name: '폭딜' },
                { probability: 0.05, damage: 0, name: '실패' }
            ]
        },
        {
            id: 'power_strike',
            name: '강타',
            type: 'attack',
            description: '강력한 단일 공격',
            effects: [
                { probability: 0.6, damage: 15, name: '강타' },
                { probability: 0.15, damage: 20, name: '강타 치명타' },
                { probability: 0.15, damage: 8, name: '강타 약공' },
                { probability: 0.1, damage: 0, name: '실패' }
            ]
        },
        {
            id: 'heal',
            name: '치유',
            type: 'support',
            description: '아군 회복',
            effects: [
                { probability: 1.0, heal: 30, name: '치유' }
            ]
        },
        {
            id: 'defend',
            name: '방어',
            type: 'defense',
            description: '받는 피해 감소',
            effects: [
                { probability: 1.0, shield: 15, name: '방어막' }
            ]
        }
    ],
    boss: [
        {
            id: 'boss_basic',
            name: '보스 기본공격',
            type: 'attack',
            description: '보스의 기본 공격',
            effects: [
                { probability: 1.0, damage: 25, name: '보스 공격' }
            ]
        },
        {
            id: 'boss_aoe',
            name: '광역 공격',
            type: 'aoe',
            description: '전체 공격',
            effects: [
                { probability: 1.0, damage: 40, name: '광역 공격' }
            ]
        }
    ]
};
exports.battleStates = {};
const processTurn = async (teamId) => {
    const battle = exports.battleStates[teamId];
    if (!battle)
        return;
    const events = [];
    for (const [userId, selection] of Object.entries(battle.playerSelections)) {
        if (!selection.locked)
            continue;
        const card = [...exports.CARD_CATALOG.ally, ...exports.CARD_CATALOG.boss].find(c => c.id === selection.cardId);
        if (!card)
            continue;
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedEffect = card.effects[0];
        for (const effect of card.effects) {
            cumulativeProbability += effect.probability;
            if (random <= cumulativeProbability) {
                selectedEffect = effect;
                break;
            }
        }
        if ('damage' in selectedEffect && selectedEffect.damage) {
            battle.bossHp = Math.max(0, battle.bossHp - selectedEffect.damage);
            battle.stunGauge.value += selectedEffect.damage;
            events.push({
                type: 'player_attack',
                userId: parseInt(userId),
                cardId: selection.cardId,
                effect: selectedEffect.name,
                damage: 'damage' in selectedEffect ? selectedEffect.damage : 0,
                bossHpRemaining: battle.bossHp
            });
        }
        if ('heal' in selectedEffect && selectedEffect.heal && selection.targetUserId) {
            const target = battle.teamMembers.find(m => m.userId === selection.targetUserId);
            if (target) {
                target.hp = Math.min(target.maxHp, target.hp + selectedEffect.heal);
                events.push({
                    type: 'heal',
                    userId: parseInt(userId),
                    targetUserId: selection.targetUserId,
                    amount: 'heal' in selectedEffect ? selectedEffect.heal : 0,
                    targetHpRemaining: target.hp
                });
            }
        }
    }
    if (battle.stunGauge.value >= battle.stunGauge.threshold && !battle.stunGauge.stunned) {
        battle.stunGauge.stunned = true;
        events.push({
            type: 'boss_stunned',
            message: '보스가 기절했습니다!'
        });
    }
    if (!battle.stunGauge.stunned && battle.bossHp > 0) {
        const bossCard = Math.random() < 0.3 ? exports.CARD_CATALOG.boss[1] : exports.CARD_CATALOG.boss[0];
        if (bossCard.id === 'boss_aoe') {
            for (const member of battle.teamMembers) {
                const damage = Math.max(0, bossCard.effects[0].damage - member.shield);
                member.hp = Math.max(0, member.hp - damage);
                member.shield = Math.max(0, member.shield - bossCard.effects[0].damage);
            }
            events.push({
                type: 'boss_aoe',
                cardId: bossCard.id,
                damage: bossCard.effects[0].damage,
                message: '보스가 광역 공격을 사용했습니다!'
            });
        }
        else {
            const aliveMember = battle.teamMembers.filter(m => m.hp > 0);
            if (aliveMember.length > 0) {
                const target = aliveMember[Math.floor(Math.random() * aliveMember.length)];
                const damage = Math.max(0, bossCard.effects[0].damage - target.shield);
                target.hp = Math.max(0, target.hp - damage);
                target.shield = Math.max(0, target.shield - bossCard.effects[0].damage);
                events.push({
                    type: 'boss_attack',
                    cardId: bossCard.id,
                    targetUserId: target.userId,
                    damage: damage,
                    targetHpRemaining: target.hp
                });
            }
        }
    }
    if (battle.stunGauge.stunned) {
        battle.stunGauge.stunned = false;
        battle.stunGauge.value = 0;
    }
    battle.activeBuffs = battle.activeBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
    const aliveMembers = battle.teamMembers.filter(m => m.hp > 0);
    if (battle.bossHp <= 0) {
        battle.phase = 'finished';
        events.push({ type: 'victory', message: '보스를 처치했습니다!' });
        await prisma_1.prisma.raidTeam.update({
            where: { id: teamId },
            data: { status: 'cleared' }
        });
    }
    else if (aliveMembers.length === 0) {
        battle.phase = 'finished';
        events.push({ type: 'defeat', message: '팀이 전멸했습니다.' });
        await prisma_1.prisma.raidTeam.update({
            where: { id: teamId },
            data: { status: 'failed' }
        });
    }
    if (battle.phase !== 'finished') {
        battle.turn++;
        battle.phase = 'select';
        battle.playerSelections = {};
    }
    battle.battleLogs.push({
        turn: battle.turn - 1,
        events: events,
        timestamp: new Date().toISOString()
    });
    return events;
};
const getCardCatalog = async (req, res) => {
    try {
        const { role } = cardQuerySchema.parse(req.query);
        let cards = [];
        if (role === 'ally') {
            cards = exports.CARD_CATALOG.ally;
        }
        else if (role === 'boss') {
            cards = exports.CARD_CATALOG.boss;
        }
        else {
            cards = [...exports.CARD_CATALOG.ally, ...exports.CARD_CATALOG.boss];
        }
        return res.status(200).json(cards);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get card catalog error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getCardCatalog = getCardCatalog;
const getBattleState = async (req, res) => {
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
                            select: { id: true, username: true, hp: true, attack_power: true }
                        }
                    }
                },
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
        if (!exports.battleStates[teamIdNum]) {
            exports.battleStates[teamIdNum] = {
                teamId: teamIdNum,
                turn: 1,
                phase: 'select',
                playerSelections: {},
                bossHp: raidTeam.boss.hp,
                maxBossHp: raidTeam.boss.hp,
                teamMembers: raidTeam.team_members.map((member) => ({
                    userId: member.user.id,
                    hp: member.user.hp,
                    maxHp: member.user.hp,
                    energy: 100,
                    shield: 0
                })),
                stunGauge: { value: 0, threshold: 100, stunned: false },
                activeBuffs: [],
                battleLogs: []
            };
        }
        const battle = exports.battleStates[teamIdNum];
        return res.status(200).json({
            turn: battle.turn,
            phase: battle.phase,
            boss: {
                hp: battle.bossHp,
                maxHp: battle.maxBossHp,
                name: raidTeam.boss.name
            },
            team: battle.teamMembers.map(member => {
                const teamMember = raidTeam.team_members.find((m) => m.user_id === member.userId);
                return {
                    userId: member.userId,
                    username: teamMember?.user.username,
                    hp: member.hp,
                    maxHp: member.maxHp,
                    energy: member.energy,
                    shield: member.shield
                };
            }),
            playerSelections: battle.playerSelections,
            stunGauge: battle.stunGauge,
            activeBuffs: battle.activeBuffs
        });
    }
    catch (error) {
        console.error('Get battle state error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getBattleState = getBattleState;
const lockCard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { cardId, targetUserId } = lockCardSchema.parse(req.body);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (battle.phase !== 'select') {
            return res.status(409).json({ error: '카드 선택 페이즈가 아닙니다.' });
        }
        const card = exports.CARD_CATALOG.ally.find(c => c.id === cardId);
        if (!card) {
            return res.status(400).json({ error: '유효하지 않은 카드입니다.' });
        }
        battle.playerSelections[userId] = {
            cardId,
            targetUserId,
            locked: true
        };
        const teamMemberCount = battle.teamMembers.filter(m => m.hp > 0).length;
        const lockedCount = Object.values(battle.playerSelections).filter(s => s.locked).length;
        if (lockedCount >= teamMemberCount) {
            const events = await processTurn(teamIdNum);
            return res.status(200).json({
                message: '카드가 선택되었습니다. 턴이 자동으로 해결됩니다.',
                autoResolved: true,
                events: events
            });
        }
        return res.status(200).json({
            message: '카드가 선택되었습니다.',
            locked: true,
            waitingForOthers: teamMemberCount - lockedCount
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Lock card error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.lockCard = lockCard;
const unlockCard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (battle.phase !== 'select') {
            return res.status(409).json({ error: '카드 선택 페이즈가 아닙니다.' });
        }
        if (!battle.playerSelections[userId]?.locked) {
            return res.status(409).json({ error: '잠금된 선택이 없습니다.' });
        }
        delete battle.playerSelections[userId];
        return res.status(204).send();
    }
    catch (error) {
        console.error('Unlock card error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.unlockCard = unlockCard;
const resolveTurn = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        const events = await processTurn(teamIdNum);
        return res.status(200).json({
            events: events,
            boss: {
                hp: battle.bossHp,
                maxHp: battle.maxBossHp
            },
            team: battle.teamMembers,
            turn: battle.turn,
            phase: battle.phase
        });
    }
    catch (error) {
        console.error('Resolve turn error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.resolveTurn = resolveTurn;
const getBattleLogs = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { fromTurn } = battleLogsQuerySchema.parse(req.query);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투 기록을 찾을 수 없습니다.' });
        }
        const filteredLogs = battle.battleLogs.filter(log => log.turn >= fromTurn);
        return res.status(200).json({
            logs: filteredLogs,
            totalTurns: battle.battleLogs.length
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get battle logs error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getBattleLogs = getBattleLogs;
const useBuff = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        const { buffId } = useBuffSchema.parse(req.body);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        if (buffId === 'TEAM_DMG_UP_20') {
            battle.activeBuffs.push({
                id: buffId,
                duration: 3,
                effect: { damageMultiplier: 1.2 }
            });
        }
        return res.status(200).json({
            message: '팀 버프가 적용되었습니다.',
            buffId: buffId,
            activeBuffs: battle.activeBuffs
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Use buff error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useBuff = useBuff;
const getStunGauge = async (req, res) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
        }
        const battle = exports.battleStates[teamIdNum];
        if (!battle) {
            return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
        }
        return res.status(200).json(battle.stunGauge);
    }
    catch (error) {
        console.error('Get stun gauge error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getStunGauge = getStunGauge;
//# sourceMappingURL=battleController.js.map