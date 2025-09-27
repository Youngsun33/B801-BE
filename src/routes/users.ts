import { Router } from 'express';
import { getMyProfile } from '../controllers/userController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/users/me
router.get('/me', authenticateAccessToken, getMyProfile);

export default router; 