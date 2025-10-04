import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 유저가 보유한 스토리 아이템 목록 조회
export const getUserStoryItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const storyItems = await prisma.userStoryItem.findMany({
      where: { user_id: userId },
      include: {
        story_item: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      },
      orderBy: {
        obtained_at: 'desc'
      }
    });

    const formattedStoryItems = storyItems.map((usi: any) => ({
      userStoryItemId: usi.id,
      quantity: usi.quantity,
      obtainedAt: usi.obtained_at,
      storyItem: usi.story_item
    }));

    return res.status(200).json({
      storyItems: formattedStoryItems
    });

  } catch (error) {
    console.error('Get user story items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

