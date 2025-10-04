import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { authenticateRefreshToken, authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// POST /api/auth/register (관리자 전용)
router.post('/register', authenticateAccessToken, requireAdmin, register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh
router.post('/refresh', authenticateRefreshToken, refresh);

// POST /api/auth/logout
router.post('/logout', authenticateAccessToken, logout);

export default router; 