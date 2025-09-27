import { Router } from 'express';
import { getTeamRaidItems } from '../controllers/shopController';
import { 
  joinRaidQueue, 
  leaveRaidQueue, 
  getMyTeam, 
  getTeamDetails 
} from '../controllers/raidController';
import {
  getCardCatalog,
  getBattleState,
  lockCard,
  unlockCard,
  resolveTurn,
  getBattleLogs,
  useBuff,
  getStunGauge
} from '../controllers/battleController';
import { getBossData, getBossAoeInfo } from '../controllers/bossController';
import { useIgnoreDamage, useHeal, useAoeAlly } from '../controllers/skillController';
import { authenticateAccessToken } from '../middleware/auth';

const router = Router();

// 대기열 관련
router.post('/queue/join', authenticateAccessToken, joinRaidQueue);
router.post('/queue/leave', authenticateAccessToken, leaveRaidQueue);

// 팀 관련
router.get('/teams/me', authenticateAccessToken, getMyTeam);
router.get('/teams/me/items', authenticateAccessToken, getTeamRaidItems);
router.get('/teams/:teamId', authenticateAccessToken, getTeamDetails);

// 전투 관련
router.get('/cards', authenticateAccessToken, getCardCatalog);
router.get('/teams/:teamId/battle', authenticateAccessToken, getBattleState);
router.post('/teams/:teamId/battle/lock', authenticateAccessToken, lockCard);
router.post('/teams/:teamId/battle/unlock', authenticateAccessToken, unlockCard);
router.post('/teams/:teamId/battle/resolve', authenticateAccessToken, resolveTurn);
router.get('/teams/:teamId/battle/logs', authenticateAccessToken, getBattleLogs);

// 버프 및 스킬
router.post('/teams/:teamId/buffs/use', authenticateAccessToken, useBuff);
router.get('/teams/:teamId/stun-gauge', authenticateAccessToken, getStunGauge);
router.post('/teams/:teamId/skills/ignore-damage', authenticateAccessToken, useIgnoreDamage);
router.post('/teams/:teamId/skills/heal', authenticateAccessToken, useHeal);
router.post('/teams/:teamId/skills/aoe-ally', authenticateAccessToken, useAoeAlly);

// 보스 관련
router.get('/teams/:teamId/boss/aoe', authenticateAccessToken, getBossAoeInfo);

// 팀 아이템 관련
import { getTeamItems, useTeamItem } from '../controllers/teamItemController';
router.get('/teams/:teamId/items', authenticateAccessToken, getTeamItems);
router.post('/teams/:teamId/items/use', authenticateAccessToken, useTeamItem);

// 결과 및 보상 관련
import { getRaidResult, getContribution } from '../controllers/rewardController';
router.get('/teams/:teamId/result', authenticateAccessToken, getRaidResult);
router.get('/teams/:teamId/contribution', authenticateAccessToken, getContribution);

export default router; 