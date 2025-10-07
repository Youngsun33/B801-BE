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
  getAdminUserDetail,
  updateAdminUser,
  updateUserInvestigationCount,
  addUserItem,
  addUserAbility,
  deleteUserResource,
  deleteUserCheckpoint,
  upload 
} from '../controllers/adminController';
import { uploadSingle, uploadImage, deleteImage } from '../controllers/uploadController';
import { authenticateAccessToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// 모든 관리자 라우트는 인증 필요
router.use(authenticateAccessToken);

// 관리자 권한 없이 열람 가능한 목록 API (토큰만 필요)
// GET /api/admin/users
router.get('/users', getAdminUsers);

// GET /api/admin/users/:id
router.get('/users/:id', getAdminUserDetail);

// GET /api/admin/resources
router.get('/resources', getAdminResources);

// 이 아래는 관리자 권한 필요
router.use(requireAdmin);

// 관리자 통계
// GET /api/admin/stats
router.get('/stats', getAdminStats);

// 사용자 수정
// PUT /api/admin/users/:id
router.put('/users/:id', updateAdminUser);

// 사용자 조사 횟수 수정
// PUT /api/admin/users/:id/investigation-count
router.put('/users/:id/investigation-count', updateUserInvestigationCount);

// 사용자 아이템 추가
// POST /api/admin/users/:id/items
router.post('/users/:id/items', addUserItem);

// 사용자 능력 추가
// POST /api/admin/users/:id/abilities
router.post('/users/:id/abilities', addUserAbility);

// 사용자 리소스 삭제 (아이템/능력 공용)
// DELETE /api/admin/users/resources/:resourceId
router.delete('/users/resources/:resourceId', deleteUserResource);

// 사용자 체크포인트 삭제
// DELETE /api/admin/users/checkpoints/:checkpointId
router.delete('/users/checkpoints/:checkpointId', deleteUserCheckpoint);


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