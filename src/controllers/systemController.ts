import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schemas
const noticesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  size: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

// 게임 시간 설정 (예시)
const GAME_SCHEDULE = {
  investigation: { start: '09:00', end: '12:00' },
  shop: { start: '12:00', end: '18:00' },
  raid: { start: '18:00', end: '21:00' }
};

// 현재 페이즈 계산 함수
const getCurrentPhase = (): 'investigation' | 'shop' | 'raid' | 'rest' => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  if (currentTime >= '09:00' && currentTime < '12:00') {
    return 'investigation';
  } else if (currentTime >= '12:00' && currentTime < '18:00') {
    return 'shop';
  } else if (currentTime >= '18:00' && currentTime < '21:00') {
    return 'raid';
  } else {
    return 'rest';
  }
};

// 임시 공지사항 데이터
const SAMPLE_NOTICES = [
  {
    id: 1,
    title: '게임 서버 오픈 안내',
    content: '드디어 게임이 정식 오픈되었습니다! 많은 참여 부탁드립니다.',
    type: 'announcement',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
  },
  {
    id: 2,
    title: '1.1.0 패치노트',
    content: '레이드 시스템 개선 및 버그 수정이 이루어졌습니다.',
    type: 'patch',
    createdAt: new Date('2024-01-02T00:00:00Z').toISOString()
  },
  {
    id: 3,
    title: '정기 점검 안내',
    content: '매주 화요일 02:00-04:00 정기 점검이 진행됩니다.',
    type: 'maintenance',
    createdAt: new Date('2024-01-03T00:00:00Z').toISOString()
  }
];

export const getServerTime = async (req: Request, res: Response) => {
  try {
    // 한국 시간으로 변환
    const now = new Date();
    const koreaTimeString = now.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
    const koreaTime = new Date(koreaTimeString + 'Z'); // ISO 형식으로 변환
    
    return res.status(200).json({
      serverTimeIso: koreaTime.toISOString(),
      tz: 'Asia/Seoul'
    });

  } catch (error) {
    console.error('Get server time error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getCurrentPhaseInfo = async (req: Request, res: Response) => {
  try {
    const phase = getCurrentPhase();
    
    return res.status(200).json({
      phase
    });

  } catch (error) {
    console.error('Get current phase error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getTodaySchedule = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(GAME_SCHEDULE);

  } catch (error) {
    console.error('Get today schedule error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getNotices = async (req: Request, res: Response) => {
  try {
    const { page, size } = noticesQuerySchema.parse(req.query);
    
    // 페이지네이션 계산
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    
    const totalCount = SAMPLE_NOTICES.length;
    const notices = SAMPLE_NOTICES.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCount / size);
    
    return res.status(200).json({
      notices,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '쿼리 파라미터가 유효하지 않습니다.',
        details: error.issues
      });
    }
    
    console.error('Get notices error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 