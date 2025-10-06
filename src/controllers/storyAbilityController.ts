import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 스토리 능력은 이제 resources 시스템으로 통합됨
// UserResource를 통해 관리

export const getUserStoryAbilities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // resources 테이블에서 SKILL 타입 조회
    const abilities = await prisma.$queryRaw<any[]>`
      SELECT ur.*, r.name, r.description, r.id as resource_id
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId} AND r.type = 'SKILL'
      ORDER BY r.name
    `;

    // 프론트엔드 형식에 맞게 변환
    const storyAbilities = abilities.map((a: any) => ({
      userStoryAbilityId: a.id,
      quantity: a.quantity,
      obtainedAt: a.obtained_at,
      storyAbility: {
        id: a.resource_id,
        name: a.name,
        description: a.description
      }
    }));

    return res.status(200).json({ storyAbilities });

  } catch (error) {
    console.error('사용자 능력 조회 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getAllStoryAbilities = async (req: Request, res: Response) => {
  try {
    // 모든 능력 목록 조회
    const abilities = await prisma.$queryRaw<any[]>`
      SELECT * FROM resources WHERE type = 'SKILL' ORDER BY name
    `;

    return res.status(200).json({ abilities });

  } catch (error) {
    console.error('능력 목록 조회 오류:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};
