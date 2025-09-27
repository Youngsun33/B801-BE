import { Router } from 'express';
import { getInventory, useStoryItem, deleteStoryItem } from '../controllers/inventoryController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/inventory
router.get('/', authenticateAccessToken, getInventory);

// POST /api/inventory/{inventoryId}/use
router.post('/:inventoryId/use', authenticateAccessToken, useStoryItem);

// DELETE /api/inventory/{inventoryId}
router.delete('/:inventoryId', authenticateAccessToken, deleteStoryItem);

export default router; 