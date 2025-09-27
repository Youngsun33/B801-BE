import { Router } from 'express';
import { getShopStatus, getShopItems, purchaseItem } from '../controllers/shopController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/shop/status
router.get('/status', authenticateAccessToken, getShopStatus);

// GET /api/shop/items
router.get('/items', authenticateAccessToken, getShopItems);

// POST /api/shop/purchase
router.post('/purchase', authenticateAccessToken, purchaseItem);

export default router; 