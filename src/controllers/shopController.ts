import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const purchaseSchema = z.object({
  itemId: z.number().min(1),
  quantity: z.number().min(1).max(10)
});

const teamItemsQuerySchema = z.object({
  day: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

// 페이즈 체크 함수
const isShopPhase = (): boolean => {
  // 개발 환경에서는 항상 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 12 && currentHour < 18; // 12-18시가 상점 페이즈
};

// 상점 아이템 목록 (일차별)
const SHOP_ITEMS = {
  1: [ // 1일차 상품
    {
      itemId: 5, // 공격력 부스터
      name: '공격력 부스터',
      description: '공격력을 일시적으로 증가시킵니다.',
      type: 'raid',
      price: 100,
      limitPerTeam: 3
    },
    {
      itemId: 6, // 방어막
      name: '방어막',
      description: '받는 피해를 줄여줍니다.',
      type: 'raid',
      price: 150,
      limitPerTeam: 2
    }
  ],
  2: [ // 2일차 상품
    {
      itemId: 5,
      name: '공격력 부스터',
      description: '공격력을 일시적으로 증가시킵니다.',
      type: 'raid',
      price: 120,
      limitPerTeam: 4
    },
    {
      itemId: 6,
      name: '방어막',
      description: '받는 피해를 줄여줍니다.',
      type: 'raid',
      price: 180,
      limitPerTeam: 3
    }
  ],
  3: [ // 3일차 상품
    {
      itemId: 5,
      name: '공격력 부스터',
      description: '공격력을 일시적으로 증가시킵니다.',
      type: 'raid',
      price: 150,
      limitPerTeam: 5
    },
    {
      itemId: 6,
      name: '방어막',
      description: '받는 피해를 줄여줍니다.',
      type: 'raid',
      price: 200,
      limitPerTeam: 4
    }
  ]
};

export const getShopStatus = async (req: Request, res: Response) => {
  try {
    const isOpen = isShopPhase();
    
    // 다음 종료 시간 계산
    const now = new Date();
    let closesAt: Date;
    
    if (isOpen) {
      // 현재 상점이 열려있으면 오늘 18시에 종료
      closesAt = new Date(now);
      closesAt.setHours(18, 0, 0, 0);
    } else {
      // 상점이 닫혀있으면 내일 12시에 다시 열림
      closesAt = new Date(now);
      if (now.getHours() >= 18) {
        closesAt.setDate(closesAt.getDate() + 1);
      }
      closesAt.setHours(12, 0, 0, 0);
    }

    return res.status(200).json({
      open: isOpen,
      closesAtIso: closesAt.toISOString()
    });

  } catch (error) {
    console.error('Get shop status error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getShopItems = async (req: Request, res: Response) => {
  try {
    if (!isShopPhase()) {
      return res.status(409).json({ error: '상점 페이즈가 아닙니다.' });
    }

    const { day } = req.query;
    const dayNum = day ? parseInt(day as string) : 1;

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
      return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
    }

    const items = SHOP_ITEMS[dayNum as keyof typeof SHOP_ITEMS] || [];

    return res.status(200).json(items);

  } catch (error) {
    console.error('Get shop items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const purchaseItem = async (req: Request, res: Response) => {
  try {
    if (!isShopPhase()) {
      return res.status(409).json({ error: '상점 페이즈가 아닙니다.' });
    }

    const userId = req.user!.userId;
    const { itemId, quantity } = purchaseSchema.parse(req.body);

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 일차의 상점 아이템 찾기
    const currentDay = user.current_day;
    const shopItems = SHOP_ITEMS[currentDay as keyof typeof SHOP_ITEMS] || [];
    const shopItem = shopItems.find(item => item.itemId === itemId);

    if (!shopItem) {
      return res.status(404).json({ error: '해당 아이템을 상점에서 찾을 수 없습니다.' });
    }

    // 총 가격 계산
    const totalPrice = shopItem.price * quantity;

    // 골드 부족 체크
    if (user.gold < totalPrice) {
      return res.status(402).json({ 
        error: 'INSUFFICIENT_GOLD',
        message: '골드가 부족합니다.',
        required: totalPrice,
        current: user.gold
      });
    }

    // 사용자의 레이드 팀 찾기 (현재 일차)
    let raidTeam = await prisma.raidTeam.findFirst({
      where: { 
        day: currentDay,
        team_members: {
          some: { user_id: userId }
        }
      },
      include: {
        raid_items: {
          where: { item_id: itemId }
        }
      }
    });

    // 팀이 없으면 생성 (임시)
    if (!raidTeam) {
      raidTeam = await prisma.raidTeam.create({
        data: {
          day: currentDay,
          status: 'ongoing',
          boss_id: 1 // 임시 보스 ID
        },
        include: {
          raid_items: {
            where: { item_id: itemId }
          }
        }
      });

      // 팀에 사용자 추가
      await prisma.teamMember.create({
        data: {
          team_id: raidTeam.id,
          user_id: userId
        }
      });
    }

    // 현재 팀의 해당 아이템 보유량 확인
    const currentTeamItem = raidTeam.raid_items[0];
    const currentQuantity = currentTeamItem?.quantity || 0;

    // 팀 한도 체크
    if (currentQuantity + quantity > shopItem.limitPerTeam) {
      return res.status(409).json({
        error: '팀 구매 한도를 초과했습니다.',
        limit: shopItem.limitPerTeam,
        current: currentQuantity,
        requested: quantity
      });
    }

    // 트랜잭션으로 구매 처리
    await prisma.$transaction(async (tx: any) => {
      // 사용자 골드 차감
      await tx.user.update({
        where: { id: userId },
        data: { gold: user.gold - totalPrice }
      });

      // 팀 레이드 아이템 추가/업데이트
      if (currentTeamItem) {
        await tx.raidItem.update({
          where: { id: currentTeamItem.id },
          data: { quantity: currentTeamItem.quantity + quantity }
        });
      } else {
        await tx.raidItem.create({
          data: {
            team_id: raidTeam!.id,
            item_id: itemId,
            quantity: quantity
          }
        });
      }
    });

    return res.status(201).json({
      message: `${shopItem.name} ${quantity}개를 구매했습니다.`,
      item: {
        itemId: shopItem.itemId,
        name: shopItem.name,
        quantity: quantity,
        totalPrice: totalPrice
      },
      remainingGold: user.gold - totalPrice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Purchase item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getTeamRaidItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { day } = teamItemsQuerySchema.parse(req.query);

    // 사용자 정보로 현재 일차 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const targetDay = day || user.current_day;

    // 사용자가 속한 레이드 팀 찾기
    const raidTeam = await prisma.raidTeam.findFirst({
      where: {
        day: targetDay,
        team_members: {
          some: { user_id: userId }
        }
      },
      include: {
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
      return res.status(404).json({ error: '해당 일차의 레이드 팀을 찾을 수 없습니다.' });
    }

    const formattedItems = raidTeam.raid_items.map((raidItem: any) => ({
      raidItemId: raidItem.id,
      quantity: raidItem.quantity,
      item: raidItem.item
    }));

    return res.status(200).json({
      teamId: raidTeam.id,
      day: raidTeam.day,
      raid_items: formattedItems
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '쿼리 파라미터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Get team raid items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 