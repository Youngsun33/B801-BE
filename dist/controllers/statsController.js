"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviveUser = exports.getUserStats = void 0;
const prisma_1 = require("../lib/prisma");
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                hp: true,
                energy: true,
                gold: true,
                attack_power: true,
                is_alive: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Get user stats error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserStats = getUserStats;
const reviveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userIdNum }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        await prisma_1.prisma.user.update({
            where: { id: userIdNum },
            data: {
                hp: 100,
                is_alive: true
            }
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Revive user error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.reviveUser = reviveUser;
//# sourceMappingURL=statsController.js.map