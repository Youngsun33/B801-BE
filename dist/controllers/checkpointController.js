"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCheckpoint = exports.getUserCheckpoints = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const loadCheckpointSchema = zod_1.z.object({
    checkpointId: zod_1.z.number()
});
const getUserCheckpoints = async (req, res) => {
    try {
        const userId = req.user.userId;
        const checkpoints = await prisma_1.prisma.userCheckpoint.findMany({
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
    }
    catch (error) {
        console.error('Get user checkpoints error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserCheckpoints = getUserCheckpoints;
const loadCheckpoint = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { checkpointId } = loadCheckpointSchema.parse(req.body);
        const checkpoint = await prisma_1.prisma.userCheckpoint.findFirst({
            where: {
                id: checkpointId,
                user_id: userId
            }
        });
        if (!checkpoint) {
            return res.status(404).json({ error: '체크포인트를 찾을 수 없습니다.' });
        }
        await prisma_1.prisma.$executeRaw `
      UPDATE investigation_sessions 
      SET current_node_id = ${checkpoint.node_id}
      WHERE user_id = ${userId} AND status = 'active'
    `;
        const nodeData = await prisma_1.prisma.$queryRaw `
      SELECT * FROM nodes WHERE node_id = ${checkpoint.node_id}
    `;
        if (nodeData.length === 0) {
            return res.status(404).json({ error: '노드를 찾을 수 없습니다.' });
        }
        const node = nodeData[0];
        const choices = await prisma_1.prisma.$queryRaw `
      SELECT c.*, n.node_id as target_node_number
      FROM choices c
      JOIN nodes n ON c.to_node_id = n.id
      WHERE c.from_node_id = ${node.id}
      ORDER BY c.order_num ASC
    `;
        const choicesFormatted = await Promise.all(choices.map(async (choice) => {
            const constraints = await prisma_1.prisma.$queryRaw `
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
                requirements: constraints.map((c) => ({
                    type: c.resource_type,
                    name: c.resource_name,
                    value: c.required_value,
                    operator: c.comparison_type
                }))
            };
        }));
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Load checkpoint error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.loadCheckpoint = loadCheckpoint;
//# sourceMappingURL=checkpointController.js.map