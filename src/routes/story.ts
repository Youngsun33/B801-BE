import { Router } from 'express';
import { 
  getActionPointStatus, 
  getStoryProgress, 
  getStoryNode, 
  chooseStoryOption, 
  autosaveStory, 
  enterStoryDay 
} from '../controllers/storyController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// GET /api/story/action-point
router.get('/action-point', authenticateAccessToken, getActionPointStatus);

// GET /api/story/progress
router.get('/progress', authenticateAccessToken, getStoryProgress);

// GET /api/story/nodes/{nodeId}
router.get('/nodes/:nodeId', authenticateAccessToken, getStoryNode);

// POST /api/story/choose
router.post('/choose', authenticateAccessToken, chooseStoryOption);

// POST /api/story/autosave
router.post('/autosave', authenticateAccessToken, autosaveStory);

// POST /api/story/day/{day}/enter
router.post('/day/:day/enter', authenticateAccessToken, enterStoryDay);

export default router; 