"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStoryItem = exports.useStoryItem = exports.getInventory = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const inventoryQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['story', 'raid']).optional()
});
const getInventory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type } = inventoryQuerySchema.parse(req.query);
        const whereClause = {
            user_id: userId
        };
        if (type) {
            whereClause.item = {
                type: type
            };
        }
        const inventory = await prisma_1.prisma.inventory.findMany({
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
        const formattedInventory = inventory.map((inv) => ({
            inventoryId: inv.id,
            quantity: inv.quantity,
            item: inv.item
        }));
        return res.status(200).json({
            inventory: formattedInventory
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get inventory error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getInventory = getInventory;
const useStoryItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { inventoryId } = req.params;
        const inventoryIdNum = parseInt(inventoryId);
        if (isNaN(inventoryIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 인벤토리 ID입니다.' });
        }
        const inventoryItem = await prisma_1.prisma.inventory.findFirst({
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
        if (inventoryItem.item.type !== 'story') {
            return res.status(409).json({ error: '스토리 아이템만 사용할 수 있습니다.' });
        }
        if (inventoryItem.quantity <= 0) {
            return res.status(409).json({ error: '사용할 수 있는 아이템이 없습니다.' });
        }
        if (inventoryItem.quantity === 1) {
            await prisma_1.prisma.inventory.delete({
                where: { id: inventoryIdNum }
            });
        }
        else {
            await prisma_1.prisma.inventory.update({
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
    }
    catch (error) {
        console.error('Use story item error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.useStoryItem = useStoryItem;
const deleteStoryItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { inventoryId } = req.params;
        const inventoryIdNum = parseInt(inventoryId);
        if (isNaN(inventoryIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 인벤토리 ID입니다.' });
        }
        const inventoryItem = await prisma_1.prisma.inventory.findFirst({
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
        if (inventoryItem.item.type === 'raid') {
            return res.status(409).json({ error: '레이드 아이템은 삭제할 수 없습니다.' });
        }
        await prisma_1.prisma.inventory.delete({
            where: { id: inventoryIdNum }
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Delete story item error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.deleteStoryItem = deleteStoryItem;
//# sourceMappingURL=inventoryController.js.map