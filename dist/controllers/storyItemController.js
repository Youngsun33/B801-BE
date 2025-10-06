"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStoryItems = exports.getUserStoryItems = void 0;
const prisma_1 = require("../lib/prisma");
const getUserStoryItems = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        const items = await prisma_1.prisma.$queryRaw `
      SELECT ur.*, r.name, r.description, r.id as resource_id
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId} AND r.type = 'ITEM'
      ORDER BY r.name
    `;
        const storyItems = items.map(i => ({
            userStoryItemId: i.id,
            quantity: i.quantity,
            obtainedAt: i.obtained_at,
            storyItem: {
                id: i.resource_id,
                name: i.name,
                description: i.description
            }
        }));
        return res.status(200).json({ storyItems });
    }
    catch (error) {
        console.error('사용자 아이템 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserStoryItems = getUserStoryItems;
const getAllStoryItems = async (req, res) => {
    try {
        const items = await prisma_1.prisma.$queryRaw `
      SELECT * FROM resources WHERE type = 'ITEM' ORDER BY name
    `;
        return res.status(200).json({ items });
    }
    catch (error) {
        console.error('아이템 목록 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getAllStoryItems = getAllStoryItems;
//# sourceMappingURL=storyItemController.js.map