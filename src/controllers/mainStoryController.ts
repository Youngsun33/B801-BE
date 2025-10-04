import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 메인 스토리 노드 조회
export const getMainStoryNode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { nodeId } = req.params;
    const nodeIdNum = parseInt(nodeId);

    // DB에서 메인 스토리 노드 조회
    const storyNode = await prisma.mainStory.findUnique({
      where: { node_id: nodeIdNum }
    });

    if (!storyNode) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    // JSON 파싱
    const choices = JSON.parse(storyNode.choices);
    const rewards = storyNode.rewards ? JSON.parse(storyNode.rewards) : null;

    // 유저 능력 조회 (선택지 필터링용)
    const userStoryAbilities = await prisma.userStoryAbility.findMany({
      where: { user_id: userId },
      include: { story_ability: true }
    });

    // 선택지 필터링 (능력 요구사항 체크)
    const filteredChoices = choices.filter((choice: any) => {
      if (!choice.requirement) return true;

      const { type, name, level } = choice.requirement;
      
      if (type === 'ability') {
        const hasAbility = userStoryAbilities.some(ua => 
          ua.story_ability.name === name && (!level || ua.quantity >= level)
        );
        return hasAbility;
      }

      return true;
    });

    return res.status(200).json({
      nodeId: storyNode.node_id,
      title: storyNode.title,
      text: storyNode.text,
      nodeType: storyNode.node_type,
      routeName: storyNode.route_name,
      choices: filteredChoices,
      rewards
    });

  } catch (error) {
    console.error('Get main story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 메인 스토리 선택지 처리
export const chooseMainStoryOption = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { choiceId } = req.body;

    if (!choiceId) {
      return res.status(400).json({ error: 'choiceId가 필요합니다.' });
    }

    // 다음 노드 조회
    const nextNode = await prisma.mainStory.findUnique({
      where: { node_id: choiceId }
    });

    if (!nextNode) {
      return res.status(404).json({ error: '다음 스토리 노드를 찾을 수 없습니다.' });
    }

    const delta: any = {
      hp: 0,
      energy: 0,
      gold: 0,
      items: [],
      abilities: []
    };

    // 보상 처리
    if (nextNode.rewards) {
      const rewards = JSON.parse(nextNode.rewards);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('사용자를 찾을 수 없습니다.');

        const updates: any = {};

        // HP, Energy, Gold
        if (rewards.hp) {
          updates.hp = Math.max(0, Math.min(100, user.hp + rewards.hp));
          delta.hp = rewards.hp;
        }
        if (rewards.energy) {
          updates.energy = Math.max(0, Math.min(100, user.energy + rewards.energy));
          delta.energy = rewards.energy;
        }
        if (rewards.gold) {
          updates.gold = Math.max(0, user.gold + rewards.gold);
          delta.gold = rewards.gold;
        }

        if (Object.keys(updates).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: updates
          });
        }

        // 능력 보상
        if (rewards.abilities && Array.isArray(rewards.abilities)) {
          for (const abilityReward of rewards.abilities) {
            // 능력 이름으로 조회
            const storyAbility = await tx.storyAbility.findFirst({
              where: { name: abilityReward.name }
            });

            if (storyAbility) {
              const existing = await tx.userStoryAbility.findFirst({
                where: {
                  user_id: userId,
                  story_ability_id: storyAbility.id
                }
              });

              if (existing) {
                await tx.userStoryAbility.update({
                  where: { id: existing.id },
                  data: { quantity: existing.quantity + (abilityReward.value || 1) }
                });
              } else {
                await tx.userStoryAbility.create({
                  data: {
                    user_id: userId,
                    story_ability_id: storyAbility.id,
                    quantity: abilityReward.value || 1
                  }
                });
              }

              delta.abilities.push({ name: abilityReward.name });
            }
          }
        }
      });
    }

    // 체크포인트 자동 저장
    if (nextNode.node_type === 'checkpoint') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const checkpointTitle = nextNode.title || `체크 포인트 ${nextNode.node_id}`;
        const checkpointDesc = nextNode.text.substring(0, 100) + '...';

        await prisma.userCheckpoint.create({
          data: {
            user_id: userId,
            node_id: nextNode.node_id,
            title: checkpointTitle,
            description: checkpointDesc,
            hp: user.hp,
            energy: user.energy,
            gold: user.gold
          }
        });

        delta.checkpoint = {
          title: checkpointTitle,
          message: '체크 포인트 달성. 보상으로 재화를 지급합니다.'
        };
      }
    }

    // 스토리 진행상황 업데이트
    await prisma.storyProgress.updateMany({
      where: { user_id: userId },
      data: { last_node_id: nextNode.node_id }
    });

    return res.status(200).json({
      nodeId: nextNode.node_id,
      delta
    });

  } catch (error) {
    console.error('Choose main story option error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

