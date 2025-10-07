import { Request, Response, NextFunction } from 'express';
import { Client } from 'pg';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
  });

  try {
    await client.connect();
    const userId = req.user!.userId; // authenticateAccessToken에서 설정됨

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

    // role 필드로 관리자 권한 확인 (role이 null이거나 'admin'이 아닌 경우)
    if (!user.role || user.role !== 'admin') {
      res.status(403).json({ error: '관리자 권한이 필요합니다.' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  } finally {
    await client.end();
  }
}; 