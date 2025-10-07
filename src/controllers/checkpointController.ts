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

    // 체크포인트는 위치만 이동 (HP/에너지/돈 복원 안 함)
    // 현재 세션의 위치만 변경
    await prisma.$executeRaw`
      UPDATE investigation_sessions 
      SET current_node_id = ${checkpoint.node_id}
      WHERE user_id = ${userId} AND status = 'active'
    `;

    // 해당 노드 정보 조회
    const nodeData = await prisma.$queryRaw<any[]>`
      SELECT * FROM nodes WHERE node_id = ${checkpoint.node_id}
    `;

    if (nodeData.length === 0) {
      return res.status(404).json({ error: '노드를 찾을 수 없습니다.' });
    }

    const node = nodeData[0];

    // 선택지 조회
    const choices = await prisma.$queryRaw<any[]>`
      SELECT c.*, n.node_id as target_node_number
      FROM choices c
      JOIN nodes n ON c.to_node_id = n.id
      WHERE c.from_node_id = ${node.id}
      ORDER BY c.order_num ASC
    `;

    // 선택지 제약조건 포함
    const choicesFormatted = await Promise.all(
      choices.map(async (choice: any) => {
        const constraints = await prisma.$queryRaw<any[]>`
          SELECT cc.*, r.name as resource_name, r.type as resource_type
          FROM choice_constraints cc
          JOIN resources r ON cc.resource_id = r.id
          WHERE cc.choice_id = ${choice.id}
        `;

        return {
          id: choice.id,
          targetNodeId: choice.target_node_number,
          label: choice.choice_text,
          available: choice.is_available,
          requirements: constraints.map((c: any) => ({
            type: c.resource_type,
            name: c.resource_name,
            value: c.required_value,
            operator: c.comparison_type
          }))
        };
      })
    );

    return res.status(200).json({
      message: '체크포인트로 이동했습니다.',
      nodeId: checkpoint.node_id,
      node: {
        nodeId: node.node_id,
        title: node.title,
        text: node.text_content,
        nodeType: node.node_type,
        choices: choicesFormatted
      }
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

