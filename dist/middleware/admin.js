"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const pg_1 = require("pg");
const requireAdmin = async (req, res, next) => {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
    });
    try {
        await client.connect();
        const userId = req.user.userId;
        const result = await client.query(`
      SELECT id, username, role 
      FROM users 
      WHERE id = $1
    `, [userId]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }
        const user = result.rows[0];
        if (!user.role || user.role !== 'admin') {
            res.status(403).json({ error: '관리자 권한이 필요합니다.' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
    finally {
        await client.end();
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=admin.js.map