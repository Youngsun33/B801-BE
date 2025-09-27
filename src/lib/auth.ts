import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  username: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  
  if (password.length > 128) {
    errors.push('비밀번호는 최대 128자까지 가능합니다.');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('비밀번호는 최소 1개의 영문자를 포함해야 합니다.');
  }
  
  if (!/\d/.test(password)) {
    errors.push('비밀번호는 최소 1개의 숫자를 포함해야 합니다.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}; 