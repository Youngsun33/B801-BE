import { Router } from 'express';
import { reviveUser } from '../controllers/statsController';
import { updateTeamStatus } from '../controllers/raidController';
import { purgeTeamItems } from '../controllers/teamItemController';
import {
  createItem,
  updateItem,
  deleteItem,
  getAllItems,
  createBoss,
  updateBoss,
  deleteBoss,
  getAllBosses,
  createMap,
  updateMap,
  deleteMap,
  getAllMaps,
  createNotice,
  getAllNotices,
  getAllStoryNodes,
  getStoryNodeById,
  createStoryNode,
  updateStoryNode,
  deleteStoryNode,
  createChoice,
  updateChoice,
  deleteChoice
} from '../controllers/adminController';
import { authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// 유저 관리
router.post('/users/:userId/revive', authenticateAccessToken, requireAdmin, reviveUser);

// 레이드 팀 관리
router.post('/raid/teams/:teamId/status', authenticateAccessToken, requireAdmin, updateTeamStatus);
router.post('/raid/teams/:teamId/items/purge', authenticateAccessToken, requireAdmin, purgeTeamItems);

// 아이템 관리
router.get('/items', authenticateAccessToken, requireAdmin, getAllItems);
router.post('/items', authenticateAccessToken, requireAdmin, createItem);
router.put('/items', authenticateAccessToken, requireAdmin, updateItem);
router.delete('/items', authenticateAccessToken, requireAdmin, deleteItem);

// 보스 관리
router.get('/bosses', authenticateAccessToken, requireAdmin, getAllBosses);
router.post('/bosses', authenticateAccessToken, requireAdmin, createBoss);
router.put('/bosses', authenticateAccessToken, requireAdmin, updateBoss);
router.delete('/bosses', authenticateAccessToken, requireAdmin, deleteBoss);

// 맵 템플릿 관리
router.get('/maps', authenticateAccessToken, requireAdmin, getAllMaps);
router.post('/maps', authenticateAccessToken, requireAdmin, createMap);
router.put('/maps', authenticateAccessToken, requireAdmin, updateMap);
router.delete('/maps', authenticateAccessToken, requireAdmin, deleteMap);

// 공지 관리
router.get('/notices', authenticateAccessToken, requireAdmin, getAllNotices);
router.post('/notices', authenticateAccessToken, requireAdmin, createNotice);

// 스토리 노드 관리
router.get('/story/nodes', authenticateAccessToken, requireAdmin, getAllStoryNodes);
router.get('/story/nodes/:nodeId', authenticateAccessToken, requireAdmin, getStoryNodeById);
router.post('/story/nodes', authenticateAccessToken, requireAdmin, createStoryNode);
router.put('/story/nodes', authenticateAccessToken, requireAdmin, updateStoryNode);
router.delete('/story/nodes', authenticateAccessToken, requireAdmin, deleteStoryNode);

// 선택지 관리
router.post('/story/choices', authenticateAccessToken, requireAdmin, createChoice);
router.put('/story/choices', authenticateAccessToken, requireAdmin, updateChoice);
router.delete('/story/choices', authenticateAccessToken, requireAdmin, deleteChoice);

export default router; 