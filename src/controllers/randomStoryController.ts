import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 랜덤 스토리는 새 ERD 구조에서 재설계 예정
// 현재는 모든 기능 비활성화

export const getRandomStory = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '랜덤 스토리는 새로운 ERD 구조로 재구현 예정입니다.' 
  });
};

export const getRandomStoryById = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '랜덤 스토리는 새로운 ERD 구조로 재구현 예정입니다.' 
  });
};

export const chooseRandomStoryOption = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '랜덤 스토리는 새로운 ERD 구조로 재구현 예정입니다.' 
  });
};

export const getAllRandomStories = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '랜덤 스토리는 새로운 ERD 구조로 재구현 예정입니다.' 
  });
};
