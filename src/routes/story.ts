import { Router } from 'express';
import { 
  getActionPointStatus, 
  getStoryProgress, 
  getStoryNode, 
  chooseStoryOption, 
  autosaveStory, 
  enterStoryDay 
} from '../controllers/storyController';
import {
  getRandomStory,
  getRandomStoryById,
  chooseRandomStoryOption,
  getAllRandomStories
} from '../controllers/randomStoryController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// 메인 스토리
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

// 랜덤 스토리
// GET /api/story/random
router.get('/random', authenticateAccessToken, getRandomStory);

// GET /api/story/random/all
router.get('/random/all', authenticateAccessToken, getAllRandomStories);

// GET /api/story/random/:storyId
router.get('/random/:storyId', authenticateAccessToken, getRandomStoryById);

// POST /api/story/random/:storyId/choose
router.post('/random/:storyId/choose', authenticateAccessToken, chooseRandomStoryOption);

export default router; 