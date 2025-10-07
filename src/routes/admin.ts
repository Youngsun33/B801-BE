import { Router } from 'express';
import { 
  importTwineFile, 
  getStoryNodes, 
  updateStoryNode, 
  deleteStoryNode, 
  createStoryNode,
  getAdminStats,
  getAdminUsers,
  getAdminResources,
  upload 
} from '../controllers/adminController';
import { uploadSingle, uploadImage, deleteImage } from '../controllers/uploadController';
import { authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// 모든 관리자 라우트는 인증과 관리자 권한 필요
router.use(authenticateAccessToken);
router.use(requireAdmin);

// 관리자 통계
// GET /api/admin/stats
router.get('/stats', getAdminStats);

// 관리자 유저/리소스 간단 목록 API
// GET /api/admin/users
router.get('/users', getAdminUsers);

// GET /api/admin/resources
router.get('/resources', getAdminResources);

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

// 이미지 업로드 관련 라우트
// POST /api/admin/upload/image
router.post('/upload/image', uploadSingle, uploadImage);

// DELETE /api/admin/upload/image/:filename
router.delete('/upload/image/:filename', deleteImage);

export default router;