import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 유저가 보유한 스토리 능력 목록 조회
export const getUserStoryAbilities = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const abilities = await prisma.userStoryAbility.findMany({
      where: { user_id: userId },
      include: {
        story_ability: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        obtained_at: 'desc'
      }
    });

    const formattedAbilities = abilities.map((usa: any) => ({
      userStoryAbilityId: usa.id,
      quantity: usa.quantity,
      obtainedAt: usa.obtained_at,
      storyAbility: usa.story_ability
    }));

    return res.status(200).json({
      storyAbilities: formattedAbilities
    });

  } catch (error) {
    console.error('Get user story abilities error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 모든 스토리 능력 목록 조회 (마스터 데이터)
export const getAllStoryAbilities = async (req: Request, res: Response) => {
  try {
    const abilities = await prisma.storyAbility.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    return res.status(200).json({
      storyAbilities: abilities
    });

  } catch (error) {
    console.error('Get all story abilities error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

