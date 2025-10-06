"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStoryAbilities = exports.getUserStoryAbilities = void 0;
const prisma_1 = require("../lib/prisma");
const getUserStoryAbilities = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        const abilities = await prisma_1.prisma.$queryRaw `
      SELECT ur.*, r.name, r.description, r.id as resource_id
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId} AND r.type = 'SKILL'
      ORDER BY r.name
    `;
        const storyAbilities = abilities.map((a) => ({
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
    }
    catch (error) {
        console.error('사용자 능력 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserStoryAbilities = getUserStoryAbilities;
const getAllStoryAbilities = async (req, res) => {
    try {
        const abilities = await prisma_1.prisma.$queryRaw `
      SELECT * FROM resources WHERE type = 'SKILL' ORDER BY name
    `;
        return res.status(200).json({ abilities });
    }
    catch (error) {
        console.error('능력 목록 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getAllStoryAbilities = getAllStoryAbilities;
//# sourceMappingURL=storyAbilityController.js.map