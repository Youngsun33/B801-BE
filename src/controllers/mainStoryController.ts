import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 메인 스토리는 storyController로 통합됨
// 모든 기능 비활성화

export const getMainStoryNode = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '이 기능은 /api/story/node/:nodeId 로 이동되었습니다.' 
  });
};

export const chooseMainStoryOption = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '이 기능은 /api/story/choose 로 이동되었습니다.' 
  });
};
