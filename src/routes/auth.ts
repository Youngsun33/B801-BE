import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { authenticateRefreshToken, authenticateAccessToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register (일반 사용자)
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh
router.post('/refresh', authenticateRefreshToken, refresh);

// POST /api/auth/logout
router.post('/logout', authenticateAccessToken, logout);

export default router; 