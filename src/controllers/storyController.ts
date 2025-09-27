import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { STORY_NODES, CHOICE_TO_NODE } from '../lib/storyNodes';

// 행동력 설정 (예시)
const MAX_ACTION_POINTS = 3;
const RECHARGE_INTERVAL_HOURS = 8; // 8시간마다 1 충전

// Validation schemas
const chooseSchema = z.object({
  choiceId: z.number().min(1)
});

const autosaveSchema = z.object({
  last_node_id: z.number().min(1)
});

const dayEnterSchema = z.object({
  day: z.number().min(1).max(3)
});

export const getActionPointStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 실제로는 DB에서 유저별 행동력 상태를 관리해야 하지만,
    // 현재 스키마에 없으므로 임시로 시간 기반 계산
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(9, 0, 0, 0); // 오전 9시 기준

    let current = MAX_ACTION_POINTS;
    let nextRechargeAtIso: string | null = null;

    // 간단한 예시: 하루에 3번 충전 (9시, 17시, 1시)
    const rechargeHours = [9, 17, 1]; // 다음날 1시
    const currentHour = now.getHours();
    
    // 다음 충전 시간 계산
    let nextRechargeHour = rechargeHours.find(hour => hour > currentHour);
    if (!nextRechargeHour) {
      // 오늘 충전 시간이 모두 지났으면 내일 첫 충전 시간
      nextRechargeHour = rechargeHours[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(nextRechargeHour, 0, 0, 0);
      nextRechargeAtIso = tomorrow.toISOString();
    } else {
      const today = new Date(now);
      today.setHours(nextRechargeHour, 0, 0, 0);
      nextRechargeAtIso = today.toISOString();
    }

    return res.status(200).json({
      current,
      max: MAX_ACTION_POINTS,
      nextRechargeAtIso
    });

  } catch (error) {
    console.error('Get action point status error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 페이즈 체크 함수
const isInvestigationPhase = (): boolean => {
  // 개발 환경에서는 항상 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 9 && currentHour < 12; // 9-12시가 조사 페이즈
};

export const getStoryProgress = async (req: Request, res: Response) => {
  try {
    if (!isInvestigationPhase()) {
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const userId = req.user!.userId;

    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    if (!progress) {
      return res.status(404).json({ error: '스토리 진행 상황을 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      current_day: progress.current_chapter,
      current_chapter: progress.current_chapter,
      last_node_id: progress.last_node_id,
      investigation_count: progress.investigation_count
    });

  } catch (error) {
    console.error('Get story progress error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getStoryNode = async (req: Request, res: Response) => {
  try {
    if (!isInvestigationPhase()) {
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const { nodeId } = req.params;
    const nodeIdNum = parseInt(nodeId);

    if (isNaN(nodeIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 노드 ID입니다.' });
    }

    const node = STORY_NODES[nodeIdNum];
    if (!node) {
      return res.status(404).json({ error: '해당 스토리 노드를 찾을 수 없습니다.' });
    }

    const userId = req.user!.userId;

    // 사용자 인벤토리 조회 (아이템 요구사항 체크용)
    const userInventory = await prisma.inventory.findMany({
      where: { user_id: userId },
      include: { item: true }
    });

    // 선택지에서 아이템 요구사항 체크
    const availableChoices = node.choices.filter(choice => {
      if (!choice.requiresItemId) return true;
      
      return userInventory.some((inv: any) => 
        inv.item_id === choice.requiresItemId && inv.quantity > 0
      );
    });

    return res.status(200).json({
      nodeId: node.nodeId,
      text: node.text,
      choices: availableChoices,
      rewards: node.rewards
    });

  } catch (error) {
    console.error('Get story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const chooseStoryOption = async (req: Request, res: Response) => {
  try {
    if (!isInvestigationPhase()) {
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const userId = req.user!.userId;
    const { choiceId } = chooseSchema.parse(req.body);

    // 사용자 스토리 진행상황 조회
    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    if (!progress) {
      return res.status(404).json({ error: '스토리 진행 상황을 찾을 수 없습니다.' });
    }

    // 행동력 체크
    if (progress.investigation_count <= 0) {
      return res.status(409).json({ error: '행동력이 부족합니다.' });
    }

    // 다음 노드 ID 확인
    const nextNodeId = CHOICE_TO_NODE[choiceId];
    if (!nextNodeId) {
      return res.status(404).json({ error: '유효하지 않은 선택입니다.' });
    }

    const nextNode = STORY_NODES[nextNodeId];
    if (!nextNode) {
      return res.status(404).json({ error: '다음 스토리 노드를 찾을 수 없습니다.' });
    }

    // 트랜잭션으로 보상 적용 및 진행상황 업데이트
    const result = await prisma.$transaction(async (tx: any) => {
      // 행동력 1 소모
      await tx.storyProgress.update({
        where: { id: progress.id },
        data: {
          last_node_id: nextNodeId,
          investigation_count: progress.investigation_count - 1
        }
      });

      const delta: any = {};

      // 보상 적용
      if (nextNode.rewards) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('사용자를 찾을 수 없습니다.');

        const updates: any = {};
        
        if (nextNode.rewards.hp) {
          const newHp = Math.max(0, Math.min(100, user.hp + nextNode.rewards.hp));
          updates.hp = newHp;
          delta.hp = nextNode.rewards.hp;
        }
        
        if (nextNode.rewards.energy) {
          const newEnergy = Math.max(0, Math.min(100, user.energy + nextNode.rewards.energy));
          updates.energy = newEnergy;
          delta.energy = nextNode.rewards.energy;
        }
        
        if (nextNode.rewards.gold) {
          updates.gold = user.gold + nextNode.rewards.gold;
          delta.gold = nextNode.rewards.gold;
        }

        if (Object.keys(updates).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: updates
          });
        }

        // 아이템 보상 처리
        if (nextNode.rewards.items) {
          delta.items = [];
          
          for (const itemReward of nextNode.rewards.items) {
            const existingInventory = await tx.inventory.findFirst({
              where: {
                user_id: userId,
                item_id: itemReward.itemId
              }
            });

            if (existingInventory) {
              await tx.inventory.update({
                where: { id: existingInventory.id },
                data: {
                  quantity: existingInventory.quantity + itemReward.quantity
                }
              });
            } else {
              await tx.inventory.create({
                data: {
                  user_id: userId,
                  item_id: itemReward.itemId,
                  quantity: itemReward.quantity
                }
              });
            }

            delta.items.push({
              itemId: itemReward.itemId,
              qty: itemReward.quantity
            });
          }
        }
      }

      return { delta, investigation_count: progress.investigation_count - 1 };
    });

    return res.status(200).json({
      nodeId: nextNodeId,
      delta: result.delta,
      investigation_count: result.investigation_count
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Choose story option error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const autosaveStory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { last_node_id } = autosaveSchema.parse(req.body);

    await prisma.storyProgress.updateMany({
      where: { user_id: userId },
      data: { last_node_id }
    });

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Autosave story error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const enterStoryDay = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { day } = req.params;
    const dayNum = parseInt(day);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
      return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
    }

    // 기존 진행상황 조회
    let progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    const startNodeId = 1000 + (dayNum * 100) + 1; // 1001, 1101, 1201

    if (progress) {
      // 이미 해당 일차에 진입한 경우 idempotent
      if (progress.current_chapter === dayNum) {
        return res.status(200).json({
          message: `${dayNum}일차에 이미 진입했습니다.`,
          current_chapter: dayNum,
          last_node_id: progress.last_node_id,
          investigation_count: progress.investigation_count
        });
      }

      // 새로운 일차 시작
      await prisma.storyProgress.update({
        where: { id: progress.id },
        data: {
          current_chapter: dayNum,
          last_node_id: startNodeId,
          investigation_count: MAX_ACTION_POINTS
        }
      });
    } else {
      // 첫 진입
      await prisma.storyProgress.create({
        data: {
          user_id: userId,
          current_chapter: dayNum,
          last_node_id: startNodeId,
          investigation_count: MAX_ACTION_POINTS
        }
      });
    }

    return res.status(200).json({
      message: `${dayNum}일차에 진입했습니다.`,
      current_chapter: dayNum,
      last_node_id: startNodeId,
      investigation_count: MAX_ACTION_POINTS
    });

  } catch (error) {
    console.error('Enter story day error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 