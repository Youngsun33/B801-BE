import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const activateAbilitySchema = z.object({
  userAbilityId: z.number().min(1)
});

// 유저가 보유한 능력 목록 조회
export const getUserAbilities = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const abilities = await prisma.userAbility.findMany({
      where: { user_id: userId },
      include: {
        ability: {
          select: {
            id: true,
            name: true,
            description: true,
            effect_type: true,
            effect_value: true
          }
        }
      },
      orderBy: {
        obtained_at: 'desc'
      }
    });

    const formattedAbilities = abilities.map((ua: any) => ({
      userAbilityId: ua.id,
      isActive: ua.is_active,
      obtainedAt: ua.obtained_at,
      ability: ua.ability
    }));

    return res.status(200).json({
      abilities: formattedAbilities
    });

  } catch (error) {
    console.error('Get user abilities error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 능력 활성화/비활성화
export const toggleAbility = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { userAbilityId } = activateAbilitySchema.parse(req.body);

    // 해당 능력이 유저의 것인지 확인
    const userAbility = await prisma.userAbility.findFirst({
      where: {
        id: userAbilityId,
        user_id: userId
      },
      include: {
        ability: true
      }
    });

    if (!userAbility) {
      return res.status(404).json({ error: '해당 능력을 찾을 수 없습니다.' });
    }

    // 능력 토글
    const updated = await prisma.userAbility.update({
      where: { id: userAbilityId },
      data: {
        is_active: !userAbility.is_active
      },
      include: {
        ability: true
      }
    });

    return res.status(200).json({
      message: updated.is_active ? '능력이 활성화되었습니다.' : '능력이 비활성화되었습니다.',
      userAbilityId: updated.id,
      isActive: updated.is_active,
      ability: updated.ability
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Toggle ability error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 모든 능력 목록 조회 (마스터 데이터)
export const getAllAbilities = async (req: Request, res: Response) => {
  try {
    const abilities = await prisma.ability.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    return res.status(200).json({
      abilities
    });

  } catch (error) {
    console.error('Get all abilities error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

