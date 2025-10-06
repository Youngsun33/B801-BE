import { Router } from 'express';
import {
  startInvestigation,
  getCurrentSession,
  updateSessionStats,
  endInvestigation,
  getRemainingInvestigations,
  enterStoryDay
} from '../controllers/investigationController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateAccessToken);

// 조사 시작
router.post('/start', startInvestigation);

// 현재 세션 조회
router.get('/session', getCurrentSession);

// 체력/정신력 업데이트
router.post('/update', updateSessionStats);

// 조사 종료
router.post('/end', endInvestigation);

// 남은 조사 횟수 확인
router.get('/remaining', getRemainingInvestigations);

export default router;

