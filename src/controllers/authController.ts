import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateTokens, hashPassword, comparePassword, validatePassword } from '../lib/auth';

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(8),
  inviteCode: z.string().optional()
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});

// 임시 refresh token 저장소 (실제로는 Redis나 DB 사용)
const refreshTokenStore = new Set<string>();

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, inviteCode } = registerSchema.parse(req.body);

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(422).json({
        error: '비밀번호 정책 위반',
        details: passwordValidation.errors
      });
    }

    // 사용자명 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({ error: '이미 사용 중인 사용자명입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 사용자 생성 (기본 스탯으로)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        hp: 100,
        energy: 100,
        gold: 1000,
        attack_power: 10,
        current_day: 1,
        is_alive: true
      },
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

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }
    
    console.error('Register error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 계정 잠금 확인 (is_alive가 false면 423)
    if (!user.is_alive) {
      return res.status(423).json({ error: '계정이 잠금되었습니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 토큰 생성
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      username: user.username
    });

    // Refresh token 저장
    refreshTokenStore.add(refreshToken);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        hp: user.hp,
        energy: user.energy,
        gold: user.gold,
        attack_power: user.attack_power,
        current_day: user.current_day,
        is_alive: user.is_alive
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }
    
    console.error('Login error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const user = req.user!; // 미들웨어에서 검증됨

    // 새 access token 생성
    const { accessToken } = generateTokens({
      userId: user.userId,
      username: user.username
    });

    return res.status(200).json({ accessToken });

  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);

    // Refresh token 무효화
    refreshTokenStore.delete(refreshToken);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }
    
    console.error('Logout error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 