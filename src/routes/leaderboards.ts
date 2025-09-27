import { Router } from 'express';
import { getDayLeaderboard } from '../controllers/rewardController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/leaderboards/day/{day}
router.get('/day/:day', authenticateAccessToken, getDayLeaderboard);

export default router; 