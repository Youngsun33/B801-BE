import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth';
import { getUserCheckpoints, loadCheckpoint } from '../controllers/checkpointController';

const router = Router();

router.get('/', authenticateAccessToken, getUserCheckpoints);
router.post('/load', authenticateAccessToken, loadCheckpoint);

export default router;

