import { Router } from 'express';
import { reviveUser } from '../controllers/statsController';
import { updateTeamStatus } from '../controllers/raidController';
import { authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// POST /api/admin/users/{userId}/revive
router.post('/users/:userId/revive', authenticateAccessToken, requireAdmin, reviveUser);

// POST /api/admin/raid/teams/{teamId}/status
router.post('/raid/teams/:teamId/status', authenticateAccessToken, requireAdmin, updateTeamStatus);

// POST /api/admin/raid/teams/{teamId}/items/purge
import { purgeTeamItems } from '../controllers/teamItemController';
router.post('/raid/teams/:teamId/items/purge', authenticateAccessToken, requireAdmin, purgeTeamItems);

export default router; 