import { Router } from 'express';
import { 
  importTwineFile, 
  getStoryNodes, 
  updateStoryNode, 
  deleteStoryNode, 
  createStoryNode,
  getAdminStats,
  getAllUsers,
  getUserDetail,
  updateUser,
  addUserItem,
  deleteUserItem,
  addUserAbility,
  deleteUserAbility,
  deleteUserCheckpoint,
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

// ===== 유저 관리 라우트 =====
// GET /api/admin/users - 모든 유저 목록
router.get('/users', getAllUsers);

// GET /api/admin/users/:userId - 특정 유저 상세 정보
router.get('/users/:userId', getUserDetail);

// PUT /api/admin/users/:userId - 유저 정보 수정
router.put('/users/:userId', updateUser);

// POST /api/admin/users/:userId/items - 유저 아이템 추가
router.post('/users/:userId/items', addUserItem);

// DELETE /api/admin/users/items/:inventoryId - 유저 아이템 삭제
router.delete('/users/items/:inventoryId', deleteUserItem);

// POST /api/admin/users/:userId/abilities - 유저 능력 추가
router.post('/users/:userId/abilities', addUserAbility);

// DELETE /api/admin/users/abilities/:abilityId - 유저 능력 삭제
router.delete('/users/abilities/:abilityId', deleteUserAbility);

// DELETE /api/admin/users/checkpoints/:checkpointId - 유저 체크포인트 삭제
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