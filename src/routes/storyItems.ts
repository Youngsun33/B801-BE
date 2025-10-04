import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth';
import { getUserStoryItems } from '../controllers/storyItemController';

const router = Router();

// 스토리용 아이템 관련
router.get('/', authenticateAccessToken, getUserStoryItems); // 내 스토리 아이템 목록

export default router;

