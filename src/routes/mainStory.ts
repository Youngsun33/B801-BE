import { Router } from 'express';
import { authenticateAccessToken } from '../middleware/auth';
import { getMainStoryNode, chooseMainStoryOption } from '../controllers/mainStoryController';

const router = Router();

router.get('/node/:nodeId', authenticateAccessToken, getMainStoryNode);
router.post('/choose', authenticateAccessToken, chooseMainStoryOption);

export default router;

