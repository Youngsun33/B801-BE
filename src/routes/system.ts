import { Router } from 'express';
import { getServerTime, getCurrentPhaseInfo, getTodaySchedule, getNotices } from '../controllers/systemController';

const router = Router();

// GET /api/system/time
router.get('/time', getServerTime);

// GET /api/system/phase
router.get('/phase', getCurrentPhaseInfo);

// GET /api/system/schedule
router.get('/schedule', getTodaySchedule);

// GET /api/system/notices
router.get('/notices', getNotices);

export default router; 