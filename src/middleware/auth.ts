import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, TokenPayload } from '../lib/auth';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateAccessToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth header:', authHeader); // 디버깅용
  console.log('Token:', token); // 디버깅용

  if (!token) {
    console.log('No token provided');
    res.status(401).json({ error: 'Access token이 필요합니다.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    console.log('Token payload:', payload); // 디버깅용
    req.user = payload;
    next();
  } catch (error) {
    console.error('Token verification failed:', error); // 디버깅용
    res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }
};

export const authenticateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Refresh token이 필요합니다.' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: '유효하지 않거나 만료된 refresh token입니다.' });
  }
}; 