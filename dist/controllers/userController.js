"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = void 0;
const prisma_1 = require("../lib/prisma");
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                hp: true,
                energy: true,
                gold: true,
                attack_power: true,
                current_day: true,
                is_alive: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getMyProfile = getMyProfile;
//# sourceMappingURL=userController.js.map