import { Router } from 'express';
import { getBossData } from '../controllers/bossController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/bosses/{bossId}
router.get('/:bossId', authenticateAccessToken, getBossData);

export default router; 