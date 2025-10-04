import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 랜덤 스토리 가져오기
export const getRandomStory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 모든 랜덤 스토리 가져오기
    const stories = await prisma.randomStory.findMany();

    if (stories.length === 0) {
      return res.status(404).json({ error: '랜덤 스토리가 없습니다.' });
    }

    // 랜덤하게 하나 선택
    const randomIndex = Math.floor(Math.random() * stories.length);
    const selectedStory = stories[randomIndex];

    // JSON 파싱
    const choices = JSON.parse(selectedStory.choices);
    const outcomes = JSON.parse(selectedStory.outcomes);

    return res.status(200).json({
      id: selectedStory.id,
      title: selectedStory.title,
      description: selectedStory.description,
      choices,
      category: selectedStory.category
    });

  } catch (error) {
    console.error('Get random story error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 특정 랜덤 스토리 조회
export const getRandomStoryById = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const storyIdNum = parseInt(storyId);

    if (isNaN(storyIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 스토리 ID입니다.' });
    }

    const story = await prisma.randomStory.findUnique({
      where: { id: storyIdNum }
    });

    if (!story) {
      return res.status(404).json({ error: '스토리를 찾을 수 없습니다.' });
    }

    const choices = JSON.parse(story.choices);
    const outcomes = JSON.parse(story.outcomes);

    return res.status(200).json({
      id: story.id,
      title: story.title,
      description: story.description,
      choices,
      outcomes,
      category: story.category
    });

  } catch (error) {
    console.error('Get random story by id error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 랜덤 스토리 선택지 선택
export const chooseRandomStoryOption = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { storyId } = req.params;
    const { choiceIndex } = req.body;

    const storyIdNum = parseInt(storyId);
    if (isNaN(storyIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 스토리 ID입니다.' });
    }

    const story = await prisma.randomStory.findUnique({
      where: { id: storyIdNum }
    });

    if (!story) {
      return res.status(404).json({ error: '스토리를 찾을 수 없습니다.' });
    }

    const choices = JSON.parse(story.choices);
    const outcomes = JSON.parse(story.outcomes);

    if (choiceIndex < 0 || choiceIndex >= choices.length) {
      return res.status(400).json({ error: '유효하지 않은 선택지입니다.' });
    }

    const selectedChoice = choices[choiceIndex];

    // 요구사항 확인
    if (selectedChoice.requirements) {
      // TODO: 실제 유저의 스탯/아이템 확인
      // 현재는 간단히 패스
    }

    // 결과 랜덤 선택 (해당 선택지의 가능한 결과들 중)
    const possibleOutcomes = outcomes.filter((o: any) => 
      o.choiceText === selectedChoice.text || 
      outcomes.length === 1
    );

    let selectedOutcome;
    if (possibleOutcomes.length > 0) {
      const randomOutcomeIndex = Math.floor(Math.random() * possibleOutcomes.length);
      selectedOutcome = possibleOutcomes[randomOutcomeIndex];
    } else {
      // 매칭되는 결과가 없으면 첫 번째 결과 사용
      selectedOutcome = outcomes[0] || { results: ['계속 진행합니다.'], rewards: [] };
    }

    // 보상 적용
    const delta: any = {};
    if (selectedOutcome.rewards && selectedOutcome.rewards.length > 0) {
      await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('사용자를 찾을 수 없습니다.');

        const updates: any = {};

        for (const reward of selectedOutcome.rewards) {
          if (reward.stat) {
            // 스탯 변경
            if (reward.stat === '체력') {
              const newHp = Math.max(0, Math.min(100, user.hp + reward.value));
              updates.hp = newHp;
              delta.hp = reward.value;
            } else if (reward.stat === '에너지') {
              const newEnergy = Math.max(0, Math.min(100, user.energy + reward.value));
              updates.energy = newEnergy;
              delta.energy = reward.value;
            } else if (reward.stat === '돈') {
              updates.gold = user.gold + reward.value;
              delta.gold = reward.value;
            }
            // TODO: 다른 스탯들 추가
          }

          if (reward.item) {
            // 아이템 지급
            // TODO: 아이템 매핑 테이블 필요
            if (!delta.items) delta.items = [];
            delta.items.push({
              name: reward.item,
              quantity: reward.quantity || 1
            });
          }
        }

        if (Object.keys(updates).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: updates
          });
        }
      });
    }

    return res.status(200).json({
      outcome: selectedOutcome,
      delta
    });

  } catch (error) {
    console.error('Choose random story option error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 모든 랜덤 스토리 목록 (관리자용)
export const getAllRandomStories = async (req: Request, res: Response) => {
  try {
    const stories = await prisma.randomStory.findMany({
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({
      stories: stories.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description.substring(0, 100) + '...',
        category: s.category
      }))
    });

  } catch (error) {
    console.error('Get all random stories error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

