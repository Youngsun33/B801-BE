import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const useItemSchema = z.object({
  teamItemId: z.number().min(1),
  consume: z.number().min(1).max(10)
});

// 아이템 효과 정의
const ITEM_EFFECTS = {
  5: { // 공격력 부스터
    type: 'damage_boost',
    value: 20,
    duration: 3,
    description: '3턴 동안 공격력 20% 증가'
  },
  6: { // 방어막
    type: 'shield',
    value: 50,
    duration: 1,
    description: '모든 팀원에게 50의 방어막 제공'
  }
};

export const getTeamItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
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

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
    if (!isMember) {
      return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
    }

    const formattedItems = raidTeam.raid_items.map((raidItem: any) => ({
      teamItemId: raidItem.id,
      quantity: raidItem.quantity,
      item: {
        ...raidItem.item,
        effect: ITEM_EFFECTS[raidItem.item.id as keyof typeof ITEM_EFFECTS] || null
      }
    }));

    return res.status(200).json({
      teamId: raidTeam.id,
      items: formattedItems
    });

  } catch (error) {
    console.error('Get team items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const useTeamItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);
    const { teamItemId, consume } = useItemSchema.parse(req.body);

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

    // 전투 중인지 확인 (페이즈 검증)
    const battleStates = require('./battleController').battleStates || {};
    const battle = battleStates[teamIdNum];
    
    if (!battle) {
      return res.status(409).json({ error: '전투 중이 아닙니다.' });
    }

    if (battle.phase === 'finished') {
      return res.status(409).json({ error: '전투가 종료되었습니다.' });
    }

    // 아이템 조회 및 수량 확인
    const teamItem = await prisma.raidItem.findUnique({
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

    // 아이템 효과 적용
    const itemEffect = ITEM_EFFECTS[teamItem.item.id as keyof typeof ITEM_EFFECTS];
    if (!itemEffect) {
      return res.status(400).json({ error: '지원하지 않는 아이템입니다.' });
    }

    // 트랜잭션으로 아이템 소모 및 효과 적용
    await prisma.$transaction(async (tx: any) => {
      // 아이템 수량 차감
      if (teamItem.quantity === consume) {
        // 수량이 0이 되면 삭제
        await tx.raidItem.delete({
          where: { id: teamItemId }
        });
      } else {
        // 수량 차감
        await tx.raidItem.update({
          where: { id: teamItemId },
          data: { quantity: teamItem.quantity - consume }
        });
      }
    });

    // 전투 상태에 효과 적용
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
      } else if (itemEffect.type === 'shield') {
        // 모든 살아있는 팀원에게 방어막 제공
        battle.teamMembers.forEach((member: any) => {
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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Use team item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const purgeTeamItems = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀 존재 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    // 모든 팀 아이템 삭제
    await prisma.raidItem.deleteMany({
      where: { team_id: teamIdNum }
    });

    console.log(`🗑️  팀 ${teamIdNum}의 모든 레이드 아이템이 소멸되었습니다.`);

    return res.status(204).send();

  } catch (error) {
    console.error('Purge team items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 