import { Router } from 'express';
import { getUserStats } from '../controllers/statsController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/users/me/stats
router.get('/me/stats', authenticateAccessToken, getUserStats);

export default router; 