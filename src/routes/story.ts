import { Router } from 'express';
import { 
  getStoryNode, 
  chooseStoryOption,
  getUserResources
} from '../controllers/storyController';
import {
  getRandomStory,
  getRandomStoryById,
  chooseRandomStoryOption,
  getAllRandomStories
} from '../controllers/randomStoryController';
import { getRemainingInvestigations, enterStoryDay } from '../controllers/investigationController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// 메인 스토리
// GET /api/story/action-point (investigation으로 리다이렉트)
router.get('/action-point', authenticateAccessToken, getRemainingInvestigations);

// GET /api/story/nodes/{nodeId}
router.get('/nodes/:nodeId', authenticateAccessToken, getStoryNode);

// POST /api/story/choose
router.post('/choose', authenticateAccessToken, chooseStoryOption);

// GET /api/story/resources
router.get('/resources', authenticateAccessToken, getUserResources);

// POST /api/story/day/:day/enter (게임 시작)
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