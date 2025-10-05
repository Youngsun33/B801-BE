import { Router } from 'express';
import { 
  importTwineFile, 
  getStoryNodes, 
  updateStoryNode, 
  deleteStoryNode, 
  createStoryNode,
  getAdminStats,
  upload 
} from '../controllers/adminController';
import { authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// 모든 관리자 라우트는 인증과 관리자 권한 필요
router.use(authenticateAccessToken);
router.use(requireAdmin);

// 관리자 통계
// GET /api/admin/stats
router.get('/stats', getAdminStats);

// Twine 파일 임포트
// POST /api/admin/import-twine
router.post('/import-twine', upload.single('twineFile'), importTwineFile);

// 스토리 노드 관리
// GET /api/admin/story-nodes
router.get('/story-nodes', getStoryNodes);

// POST /api/admin/story-nodes
router.post('/story-nodes', createStoryNode);

// PUT /api/admin/story-nodes/:nodeId
router.put('/story-nodes/:nodeId', updateStoryNode);

// DELETE /api/admin/story-nodes/:nodeId
router.delete('/story-nodes/:nodeId', deleteStoryNode);

export default router;