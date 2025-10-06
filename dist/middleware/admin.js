"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const prisma_1 = require("../lib/prisma");
const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, role: true }
        });
        if (!user) {
            res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }
        if (user.role !== 'admin') {
            res.status(403).json({ error: '관리자 권한이 필요합니다.' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=admin.js.map