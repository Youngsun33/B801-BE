import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const inventoryQuerySchema = z.object({
  type: z.enum(['story', 'raid']).optional()
});

export const getInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type } = inventoryQuerySchema.parse(req.query);

    const whereClause: any = {
      user_id: userId
    };

    // 타입 필터링이 있으면 추가
    if (type) {
      whereClause.item = {
        type: type
      };
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    // 응답 형태 변환
    const formattedInventory = inventory.map((inv: any) => ({
      inventoryId: inv.id,
      quantity: inv.quantity,
      item: inv.item
    }));

    return res.status(200).json({
      inventory: formattedInventory
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '쿼리 파라미터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Get inventory error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const useStoryItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { inventoryId } = req.params;
    const inventoryIdNum = parseInt(inventoryId);

    if (isNaN(inventoryIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 인벤토리 ID입니다.' });
    }

    // 인벤토리 아이템 조회
    const inventoryItem = await prisma.inventory.findFirst({
      where: {
        id: inventoryIdNum,
        user_id: userId
      },
      include: {
        item: true
      }
    });

    if (!inventoryItem) {
      return res.status(404).json({ error: '해당 아이템을 찾을 수 없습니다.' });
    }

    // 스토리 아이템만 사용 가능
    if (inventoryItem.item.type !== 'story') {
      return res.status(409).json({ error: '스토리 아이템만 사용할 수 있습니다.' });
    }

    // 수량 확인
    if (inventoryItem.quantity <= 0) {
      return res.status(409).json({ error: '사용할 수 있는 아이템이 없습니다.' });
    }

    // 아이템 사용 (수량 -1)
    if (inventoryItem.quantity === 1) {
      // 수량이 1이면 인벤토리에서 제거
      await prisma.inventory.delete({
        where: { id: inventoryIdNum }
      });
    } else {
      // 수량이 1보다 많으면 수량만 감소
      await prisma.inventory.update({
        where: { id: inventoryIdNum },
        data: {
          quantity: inventoryItem.quantity - 1
        }
      });
    }

    return res.status(200).json({
      message: `${inventoryItem.item.name}을(를) 사용했습니다.`,
      item: {
        id: inventoryItem.item.id,
        name: inventoryItem.item.name,
        description: inventoryItem.item.description
      }
    });

  } catch (error) {
    console.error('Use story item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteStoryItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { inventoryId } = req.params;
    const inventoryIdNum = parseInt(inventoryId);

    if (isNaN(inventoryIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 인벤토리 ID입니다.' });
    }

    // 인벤토리 아이템 조회
    const inventoryItem = await prisma.inventory.findFirst({
      where: {
        id: inventoryIdNum,
        user_id: userId
      },
      include: {
        item: true
      }
    });

    if (!inventoryItem) {
      return res.status(404).json({ error: '해당 아이템을 찾을 수 없습니다.' });
    }

    // 레이드 아이템은 삭제 불가
    if (inventoryItem.item.type === 'raid') {
      return res.status(409).json({ error: '레이드 아이템은 삭제할 수 없습니다.' });
    }

    // 스토리 아이템 삭제
    await prisma.inventory.delete({
      where: { id: inventoryIdNum }
    });

    return res.status(204).send();

  } catch (error) {
    console.error('Delete story item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 