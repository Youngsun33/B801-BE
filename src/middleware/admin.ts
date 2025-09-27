import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId; // authenticateAccessToken에서 설정됨

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!user) {
      res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 임시로 특정 사용자명을 관리자로 처리 (실제로는 role 필드 사용)
    // 현재 스키마에 role이 없으므로 username으로 판단
    const adminUsernames = ['admin', 'administrator', 'root'];
    
    if (!adminUsernames.includes(user.username.toLowerCase())) {
      res.status(403).json({ error: '관리자 권한이 필요합니다.' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 