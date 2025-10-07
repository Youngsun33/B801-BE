import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const leaderboardQuerySchema = z.object({
  type: z.enum(['damage', 'clearTime']).optional().default('damage')
});

export const getRaidResult = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum },
      include: {
        team_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                attack_power: true,
                is_alive: true
              }
            }
          }
        },
        boss: {
          select: {
            id: true,
            name: true,
            hp: true
          }
        }
      }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
    if (!isMember) {
      return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
    }

    // 전투 로그에서 결과 계산
    const battleStates = require('./battleController').battleStates || {};
    const battle = battleStates[teamIdNum];
    
    let totalDamageDealt = 0;
    let clearTime = null;
    let rewards = {};

    if (battle && battle.battleLogs) {
      // 총 피해량 계산
      battle.battleLogs.forEach((log: any) => {
        log.events.forEach((event: any) => {
          if (event.type === 'player_attack' && event.damage) {
            totalDamageDealt += event.damage;
          }
        });
      });

      // 클리어 시간 계산 (턴 수 기준)
      if (raidTeam.status === 'cleared') {
        clearTime = battle.battleLogs.length;
        
        // 보상 계산
        const baseGoldReward = 100 * raidTeam.day; // 일차별 기본 골드
        const timeBonus = Math.max(0, 50 - (clearTime * 5)); // 빠른 클리어 보너스
        
        rewards = {
          gold: baseGoldReward + timeBonus,
          experience: 50 * raidTeam.day,
          items: clearTime <= 10 ? [
            { itemId: 1, name: '치료 포션', quantity: 2 },
            { itemId: 2, name: '에너지 드링크', quantity: 1 }
          ] : [
            { itemId: 1, name: '치료 포션', quantity: 1 }
          ]
        };
      }
    }

    const result = {
      teamId: raidTeam.id,
      day: raidTeam.day,
      status: raidTeam.status,
      boss: {
        name: raidTeam.boss.name,
        maxHp: raidTeam.boss.hp,
        remainingHp: battle?.bossHp || 0
      },
      team: raidTeam.team_members.map((member: any) => ({
        userId: member.user.id,
        username: member.user.username,
        isAlive: member.user.is_alive
      })),
      stats: {
        totalDamageDealt: totalDamageDealt,
        clearTime: clearTime,
        turnsPlayed: battle?.battleLogs?.length || 0
      },
      rewards: raidTeam.status === 'cleared' ? rewards : null,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Get raid result error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getContribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;
    const teamIdNum = parseInt(teamId);

    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 팀 ID입니다.' });
    }

    // 팀원 권한 확인
    const raidTeam = await prisma.raidTeam.findUnique({
      where: { id: teamIdNum },
      include: {
        team_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!raidTeam) {
      return res.status(404).json({ error: '레이드 팀을 찾을 수 없습니다.' });
    }

    const isMember = raidTeam.team_members.some((member: any) => member.user_id === userId);
    if (!isMember) {
      return res.status(403).json({ error: '팀원만 접근할 수 있습니다.' });
    }

    // 전투 로그에서 개인 기여도 계산
    const battleStates = require('./battleController').battleStates || {};
    const battle = battleStates[teamIdNum];
    
    const contributions: Record<number, {
      userId: number;
      username: string;
      damage: number;
      heals: number;
      buffsUsed: number;
      cardsPlayed: number;
    }> = {};

    // 초기화
    raidTeam.team_members.forEach((member: any) => {
      contributions[member.user.id] = {
        userId: member.user.id,
        username: member.user.username,
        damage: 0,
        heals: 0,
        buffsUsed: 0,
        cardsPlayed: 0
      };
    });

    if (battle && battle.battleLogs) {
      battle.battleLogs.forEach((log: any) => {
        log.events.forEach((event: any) => {
          const contrib = contributions[event.userId];
          if (!contrib) return;

          switch (event.type) {
            case 'player_attack':
              contrib.damage += event.damage || 0;
              contrib.cardsPlayed += 1;
              break;
            case 'heal':
              contrib.heals += event.amount || 0;
              contrib.cardsPlayed += 1;
              break;
            case 'buff_used':
              contrib.buffsUsed += 1;
              break;
          }
        });
      });
    }

    return res.status(200).json({
      teamId: raidTeam.id,
      contributions: Object.values(contributions)
    });

  } catch (error) {
    console.error('Get contribution error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getDayLeaderboard = async (req: Request, res: Response) => {
  try {
    const { day } = req.params;
    const dayNum = parseInt(day);
    const { type } = leaderboardQuerySchema.parse(req.query);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
      return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
    }

    // 해당 일차의 모든 팀 조회
    const raidTeams = await prisma.raidTeam.findMany({
      where: { 
        day: dayNum,
        status: 'cleared' // 클리어한 팀만
      },
      include: {
        team_members: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        boss: {
          select: {
            name: true
          }
        }
      }
    });

    // 전투 로그에서 통계 계산
    const battleStates = require('./battleController').battleStates || {};
    const leaderboardData = raidTeams.map((team: any) => {
      const battle = battleStates[team.id];
      let totalDamage = 0;
      let clearTime = battle?.battleLogs?.length || 999;

      if (battle && battle.battleLogs) {
        battle.battleLogs.forEach((log: any) => {
          log.events.forEach((event: any) => {
            if (event.type === 'player_attack' && event.damage) {
              totalDamage += event.damage;
            }
          });
        });
      }

      return {
        teamId: team.id,
        day: team.day,
        bossName: team.boss.name,
        members: team.team_members.map((member: any) => member.user.username),
        totalDamage: totalDamage,
        clearTime: clearTime,
        status: team.status
      };
    });

    // 정렬
    if (type === 'damage') {
      leaderboardData.sort((a: any, b: any) => b.totalDamage - a.totalDamage);
    } else if (type === 'clearTime') {
      leaderboardData.sort((a: any, b: any) => a.clearTime - b.clearTime);
    }

    // 순위 추가
    const rankedData = leaderboardData.map((team: any, index: number) => ({
      rank: index + 1,
      ...team
    }));

    return res.status(200).json({
      day: dayNum,
      type: type,
      leaderboard: rankedData.slice(0, 50) // 상위 50팀만
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '쿼리 파라미터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Get day leaderboard error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 