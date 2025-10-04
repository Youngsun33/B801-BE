import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth';
import {
  getUserAbilities,
  toggleAbility,
  getAllAbilities
} from '../controllers/abilityController';

const router = Router();

// 레이드용 능력 관련
router.get('/', authenticateAccessToken, getUserAbilities);              // 내 레이드 능력 목록
router.get('/all', authenticateAccessToken, getAllAbilities);            // 모든 레이드 능력 마스터 데이터
router.post('/toggle', authenticateAccessToken, toggleAbility);          // 능력 활성화/비활성화

export default router;

