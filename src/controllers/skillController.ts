import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const ignoreDamageSchema = z.object({
  appliesTo: z.enum(['boss_aoe']),
  turn: z.number().min(1)
});

const healSchema = z.object({
  targetUserId: z.number(),
  amount: z.number().min(1).max(200).optional().default(50)
});

const aoeAllySchema = z.object({
  cardId: z.string()
});

// 전투 상태 가져오기 (battleController에서 import)
const getBattleState = (teamId: number) => {
  // 실제로는 battleController에서 export해야 하지만, 간단히 구현
  const battleStates = require('./battleController').battleStates || {};
  return battleStates[teamId];
};

export const useIgnoreDamage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);
    const { appliesTo, turn } = ignoreDamageSchema.parse(req.body);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum },
      include: {
        team_members: true
      }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
    if (!isMember) {
      return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
    }

    const battle = getBattleState(teamIdNum);
    if (!battle) {
      return res.status(404).json({ error: '전투가 진행중이 아닙니다.' });
    }

    if (appliesTo === 'boss_aoe') {
      // 해당 턴에 AOE 피해 무시 버프 추가
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Use ignore damage error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const useHeal = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);
    const { targetUserId, amount } = healSchema.parse(req.body);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum },
      include: {
        team_members: true
      }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
    if (!isMember) {
      return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
    }

    const isTargetMember = raidTeam.team_members.some((member: any) => member.user_id === targetUserId);
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

    // 대상 찾기
    const target = battle.teamMembers.find((member: any) => member.userId === targetUserId);
    if (!target) {
      return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });
    }

    if (target.hp <= 0) {
      return res.status(409).json({ error: '사망한 대상은 치료할 수 없습니다.' });
    }

    // 힐 적용
    const healAmount = Math.min(amount, target.maxHp - target.hp);
    target.hp += healAmount;

    // 힐 사용자는 이번 턴 공격 불가 (선택 잠금)
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Use heal error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const useAoeAlly = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);
    const { cardId } = aoeAllySchema.parse(req.body);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum },
      include: {
        team_members: true
      }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
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

    // 광역 공격 카드 확인
    const CARD_CATALOG = require('./battleController').CARD_CATALOG;
    const card = CARD_CATALOG.ally.find((c: any) => c.id === cardId);
    
    if (!card || card.type !== 'attack') {
      return res.status(400).json({ error: '유효하지 않은 공격 카드입니다.' });
    }

    // 광역 공격 처리 (즉시 실행)
    const baseDamage = card.effects[0].damage || 10;
    const distributedDamage = Math.floor(baseDamage * 0.5); // 50% 분배

    // 모든 살아있는 팀원이 공격에 참여
    const aliveMembers = battle.teamMembers.filter((member: any) => member.hp > 0);
    const totalDamage = distributedDamage * aliveMembers.length;

    battle.bossHp = Math.max(0, battle.bossHp - totalDamage);
    battle.stunGauge.value += totalDamage;

    // 사용자 선택 잠금
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Use AOE ally error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 