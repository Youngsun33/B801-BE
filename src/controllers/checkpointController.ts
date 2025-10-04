import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const loadCheckpointSchema = z.object({
  checkpointId: z.number()
});

// 유저의 체크포인트 목록 조회
export const getUserCheckpoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const checkpoints = await prisma.userCheckpoint.findMany({
      where: { user_id: userId },
      orderBy: { saved_at: 'desc' }
    });

    return res.status(200).json({
      checkpoints: checkpoints.map(cp => ({
        id: cp.id,
        nodeId: cp.node_id,
        title: cp.title,
        description: cp.description,
        hp: cp.hp,
        energy: cp.energy,
        gold: cp.gold,
        savedAt: cp.saved_at
      }))
    });

  } catch (error) {
    console.error('Get user checkpoints error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 체크포인트 로드
export const loadCheckpoint = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { checkpointId } = loadCheckpointSchema.parse(req.body);

    // 체크포인트 조회
    const checkpoint = await prisma.userCheckpoint.findFirst({
      where: {
        id: checkpointId,
        user_id: userId
      }
    });

    if (!checkpoint) {
      return res.status(404).json({ error: '체크포인트를 찾을 수 없습니다.' });
    }

    // 유저 상태 복원
    await prisma.user.update({
      where: { id: userId },
      data: {
        hp: checkpoint.hp,
        energy: checkpoint.energy,
        gold: checkpoint.gold
      }
    });

    // 스토리 진행상황 업데이트
    await prisma.storyProgress.updateMany({
      where: { user_id: userId },
      data: {
        last_node_id: checkpoint.node_id
      }
    });

    return res.status(200).json({
      message: '체크포인트를 불러왔습니다.',
      nodeId: checkpoint.node_id,
      hp: checkpoint.hp,
      energy: checkpoint.energy,
      gold: checkpoint.gold
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Load checkpoint error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

