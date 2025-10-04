import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth';
import {
  getUserStoryAbilities,
  getAllStoryAbilities
} from '../controllers/storyAbilityController';

const router = Router();

// 스토리용 능력 관련
router.get('/', authenticateAccessToken, getUserStoryAbilities);         // 내 스토리 능력 목록
router.get('/all', authenticateAccessToken, getAllStoryAbilities);       // 모든 스토리 능력 마스터 데이터

export default router;

