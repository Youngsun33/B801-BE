import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { STORY_NODES, CHOICE_TO_NODE } from '../lib/storyNodes';

// 행동력 설정 (예시)
const MAX_ACTION_POINTS = 3;
const RECHARGE_INTERVAL_HOURS = 8; // 8시간마다 1 충전

// 선택지 요구사항 체크 함수
async function checkChoiceRequirements(userId: number, requirements: any[]): Promise<boolean> {
  if (!requirements || requirements.length === 0) {
    return true;
  }

  for (const req of requirements) {
    switch (req.requirement_type) {
      case 'ability':
        // 스토리 능력 체크
        const userAbility = await prisma.userStoryAbility.findFirst({
          where: {
            user_id: userId,
            story_ability_id: req.requirement_id
          }
        });
        
        if (!userAbility || userAbility.quantity < (req.requirement_value || 1)) {
          console.log(`능력 요구사항 미충족: ${req.requirement_id}, 필요: ${req.requirement_value}, 보유: ${userAbility?.quantity || 0}`);
          return false;
        }
        break;
        
      case 'item':
        // 스토리 아이템 체크
        const userItem = await prisma.userStoryItem.findFirst({
          where: {
            user_id: userId,
            story_item_id: req.requirement_id
          }
        });
        
        if (!userItem || userItem.quantity < (req.requirement_value || 1)) {
          console.log(`아이템 요구사항 미충족: ${req.requirement_id}, 필요: ${req.requirement_value}, 보유: ${userItem?.quantity || 0}`);
          return false;
        }
        break;
        
      case 'stat':
        // 스탯 체크 (HP, 에너지, 골드 등)
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) return false;
        
        const statValue = user[req.requirement_id as keyof typeof user] as number;
        if (statValue < (req.requirement_value || 0)) {
          console.log(`스탯 요구사항 미충족: ${req.requirement_id}, 필요: ${req.requirement_value}, 보유: ${statValue}`);
          return false;
        }
        break;
        
      default:
        console.log(`알 수 없는 요구사항 타입: ${req.requirement_type}`);
        break;
    }
  }
  
  return true;
}

// Validation schemas
const chooseSchema = z.object({
  choiceId: z.number().min(1)
});

const autosaveSchema = z.object({
  last_node_id: z.number().min(1)
});

const dayEnterSchema = z.object({
  day: z.number().min(1).max(3)
});

export const getActionPointStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // DB에서 실제 행동력 상태 조회
    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    let current = MAX_ACTION_POINTS;
    
    // 진행상황이 있으면 DB 값 사용
    if (progress) {
      current = progress.investigation_count;
    }

    const now = new Date();
    let nextRechargeAtIso: string | null = null;

    // 간단한 예시: 하루에 3번 충전 (9시, 17시, 1시)
    const rechargeHours = [9, 17, 1]; // 다음날 1시
    const currentHour = now.getHours();
    
    // 다음 충전 시간 계산
    let nextRechargeHour = rechargeHours.find(hour => hour > currentHour);
    if (!nextRechargeHour) {
      // 오늘 충전 시간이 모두 지났으면 내일 첫 충전 시간
      nextRechargeHour = rechargeHours[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(nextRechargeHour, 0, 0, 0);
      nextRechargeAtIso = tomorrow.toISOString();
    } else {
      const today = new Date(now);
      today.setHours(nextRechargeHour, 0, 0, 0);
      nextRechargeAtIso = today.toISOString();
    }

    return res.status(200).json({
      current,
      max: MAX_ACTION_POINTS,
      nextRechargeAtIso
    });

  } catch (error) {
    console.error('Get action point status error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 페이즈 체크 함수
const isInvestigationPhase = (): boolean => {
  // 개발 환경에서는 항상 허용
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 9 && currentHour < 12; // 9-12시가 조사 페이즈
};

export const getStoryProgress = async (req: Request, res: Response) => {
  try {
    if (!isInvestigationPhase()) {
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const userId = req.user!.userId;

    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    if (!progress) {
      return res.status(404).json({ error: '스토리 진행 상황을 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      current_day: progress.current_chapter,
      current_chapter: progress.current_chapter,
      last_node_id: progress.last_node_id,
      investigation_count: progress.investigation_count
    });

  } catch (error) {
    console.error('Get story progress error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getStoryNode = async (req: Request, res: Response) => {
  try {
    if (!isInvestigationPhase()) {
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const { nodeId } = req.params;
    
    
    const nodeIdNum = parseInt(nodeId);

    if (isNaN(nodeIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 노드 ID입니다.' });
    }

    const userId = req.user!.userId;

    // 랜덤 트리거 노드인지 확인
    const mainStoryNode = await prisma.mainStory.findUnique({
      where: { node_id: nodeIdNum }
    });

    if (mainStoryNode && mainStoryNode.node_type === 'random_trigger') {
      // 랜덤 스토리 5개 선택
      const randomStories = await prisma.randomStory.findMany({
        take: 5,
        orderBy: {
          id: 'asc' // 또는 랜덤 정렬
        }
      });

      return res.status(200).json({
        nodeId: mainStoryNode.node_id,
        title: mainStoryNode.title,
        text: mainStoryNode.text,
        nodeType: 'random_trigger',
        routeName: mainStoryNode.route_name,
        choices: [
          {
            id: 0,
            targetNodeId: 0,
            label: "랜덤 스토리 진행",
            available: true,
            requirements: []
          }
        ],
        randomStories: randomStories.map((story: any) => ({
          id: story.id,
          title: story.title,
          text: story.text,
          choices: JSON.parse(story.choices),
          outcomes: JSON.parse(story.outcomes)
        })),
        rewards: null
      });
    }

    // 노드 조회: 모든 노드를 메인 스토리 DB에서 조회
    console.log('메인 스토리 DB에서 노드 조회:', nodeIdNum);
    const mainStoryNodeForCheck = await prisma.mainStory.findUnique({
      where: { node_id: nodeIdNum }
    });
    
    if (!mainStoryNodeForCheck) {
      console.log('DB에서 노드를 찾을 수 없음, STORY_NODES에서 조회 시도:', nodeIdNum);
      // DB에서 찾을 수 없으면 STORY_NODES에서 조회
      if (STORY_NODES[nodeIdNum]) {
        const fallbackNode = STORY_NODES[nodeIdNum];
        return res.status(200).json({
          nodeId: fallbackNode.nodeId,
          text: fallbackNode.text,
          choices: fallbackNode.choices,
          rewards: fallbackNode.rewards
        });
      }
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }
      
    // 새로운 StoryChoice 테이블에서 선택지 가져오기
    const storyChoices = await prisma.storyChoice.findMany({
      where: { story_node_id: nodeIdNum },
      orderBy: { order_index: 'asc' },
      include: {
        choice_requirements: true
      }
    });

    // 사용자 능력 조회 (선택지 필터링용)
    const userStoryAbilities = await prisma.userStoryAbility.findMany({
      where: { user_id: userId },
      include: { story_ability: true }
    });

    // StoryChoice를 게임 형식으로 변환
    const choices = storyChoices.map((choice: any, index: number) => {
      // 요구사항 체크
      const isAvailable = choice.is_available && 
        choice.choice_requirements.every((req: any) => {
          if (req.requirement_type === 'ability') {
            // 능력 요구사항 체크
            const hasAbility = userStoryAbilities.some((ua: any) => 
              ua.story_ability.name === req.description?.split(' ')[0] && 
              ua.quantity >= (req.requirement_value || 1)
            );
            return hasAbility;
          }
          // 다른 요구사항 타입들은 일단 true로 처리
          return true;
        });

      return {
        id: choice.id, // 선택지 ID
        targetNodeId: choice.target_node_id,
        label: choice.choice_text,
        available: isAvailable,
        requirements: choice.choice_requirements.map((req: any) => ({
          type: req.requirement_type,
          value: req.requirement_value,
          operator: req.operator,
          description: req.description
        }))
      };
    });
    
    // mainStoryNode가 null인 경우 처리
    if (!mainStoryNodeForCheck) {
      return res.status(404).json({ error: '노드를 찾을 수 없습니다.' });
    }

    // 기존 choices JSON 파싱 (fallback)
    let fallbackChoices = [];
    try {
      fallbackChoices = JSON.parse(mainStoryNodeForCheck.choices || '[]');
    } catch (e) {
      console.error('Choices JSON 파싱 오류:', e);
    }

    // StoryChoice가 있으면 사용, 없으면 기존 choices 사용
    const finalChoices = choices.length > 0 ? choices : fallbackChoices;

    let node = {
      nodeId: mainStoryNodeForCheck.node_id,
      title: mainStoryNodeForCheck.title,
      text: mainStoryNodeForCheck.text,
      choices: finalChoices,
      rewards: mainStoryNodeForCheck.rewards ? JSON.parse(mainStoryNodeForCheck.rewards) : undefined,
      nodeType: mainStoryNodeForCheck.node_type,
      routeName: mainStoryNodeForCheck.route_name
    };

    // 노드 4번: 랜덤 능력 2개 부여
    if (nodeIdNum === 4) {
      const abilityPool = [
        { id: 1, name: '관찰력', desc: '당신의 장점은 눈이 아주 좋다는 것입니다. 다른 사람이 쉽게 찾지 못할 것들도 매의 눈으로 찾아내기 마련이죠.' },
        { id: 2, name: '근력', desc: '당신의 장점은 힘이 아주 세다는 겁니다. 이 같은 세상에서 힘이란 무엇과도 바꿀 수 없는 능력입니다.' },
        { id: 3, name: '민첩함', desc: '당신의 장점은 다리가 아주 빠르다는 겁니다. 웬만한 사람들은 당신이 마음만 먹으면 모두 따돌릴 수 있습니다. 물론 기계 앞에서는 무용지물이겠지만요.' },
        { id: 4, name: '은신술', desc: '당신은 인기척을 숨기는 데 달인입니다. 이상한 피에로 옷만 입지 않는 이상 당신이 마음만 먹으면 몰래 다니는 것쯤이야 아주 쉬운 일입니다.' },
        { id: 5, name: '손재주', desc: '당신은 손으로 만드는 모든 것에 재능이 있습니다. 만들기, 기계 수리, 많게는 도박까지……. 뭐, 거기까지 쓸 일이 있겠어요.' },
        { id: 6, name: '언변술', desc: '당신은 말의 귀재입니다. 입 하나로 잘하면 차까지 살 수 있을 정도예요. 조금 더 노력하면 나라까지 얻을 수 있지 않겠어요?' },
        { id: 7, name: '매력', desc: '당신의 장점은 멋진 외모! 모두가 당신을 보는 순간 깊은 매력에 빠지게 될 겁니다.' },
        { id: 8, name: '직감', desc: '하잘것없어 보여도 세상 무엇보다도 귀한 재능이 바로 직감입니다. 당신은 빠른 눈치로 모든 장애물을 헤쳐 나갈 수 있을 겁니다.' }
      ];

      // 진행상황 조회
      const progress = await prisma.storyProgress.findFirst({
        where: { user_id: userId }
      });
      
      let selectedIds: number[] = [];
      
      // temp_data에 이미 저장된 능력이 있는지 확인
      if (progress?.temp_data) {
        try {
          const tempData = JSON.parse(progress.temp_data);
          if (tempData.selectedAbilities && Array.isArray(tempData.selectedAbilities)) {
            selectedIds = tempData.selectedAbilities;
            console.log('기존 temp_data에서 능력 로드:', selectedIds);
          }
        } catch (e) {
          console.error('temp_data 파싱 실패:', e);
        }
      }
      
      // temp_data가 없으면 새로 랜덤 선택
      if (selectedIds.length === 0) {
        const shuffled = abilityPool.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        selectedIds = selected.map(a => a.id);
        
        // temp_data에 저장
        if (progress) {
          await prisma.storyProgress.update({
            where: { id: progress.id },
            data: {
              temp_data: JSON.stringify({
                selectedAbilities: selectedIds
              })
            }
          });
        }
        console.log('새로운 능력 랜덤 선택 및 저장:', selectedIds);
      }
      
      // ID로부터 능력 정보 추출
      const selected = abilityPool.filter(a => selectedIds.includes(a.id));
      
      // 텍스트 생성: 기본 텍스트 + 능력 목록
      const abilityText = `당신이 가진 능력이 깨어났습니다...\n\n이제 얻은 능력\n\n${selected.map(a => `+ ${a.name}\n${a.desc}`).join('\n\n')}`;
      
      // 노드 수정
      node = {
        ...node,
        text: abilityText,
        rewards: {
          ...node.rewards,
          abilities: selected.map(a => ({ abilityId: a.id }))
        }
      };
    }

    // 사용자 인벤토리 조회 (아이템 요구사항 체크용)
    const userInventory = await prisma.inventory.findMany({
      where: { user_id: userId },
      include: { item: true }
    });

    // 선택지에서 아이템 요구사항 체크
    const availableChoices = node.choices.filter((choice: any) => {
      if (!choice.requiresItemId) return true;
      
      return userInventory.some((inv: any) => 
        inv.item_id === choice.requiresItemId && inv.quantity > 0
      );
    });

    return res.status(200).json({
      nodeId: node.nodeId,
      text: node.text,
      choices: availableChoices,
      rewards: node.rewards
    });

  } catch (error) {
    console.error('Get story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const chooseStoryOption = async (req: Request, res: Response) => {
  try {
    console.log('=== chooseStoryOption 시작 ===');
    console.log('요청 body:', req.body);
    
    if (!isInvestigationPhase()) {
      console.log('조사 페이즈 체크 실패');
      return res.status(409).json({ error: '조사 페이즈가 아닙니다.' });
    }

    const userId = req.user!.userId;
    console.log('사용자 ID:', userId);
    
    const { choiceId } = chooseSchema.parse(req.body);
    console.log('선택지 ID:', choiceId);

    // 사용자 스토리 진행상황 조회
    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });
    console.log('진행상황:', progress);

    if (!progress) {
      console.log('진행상황 없음');
      return res.status(404).json({ error: '스토리 진행 상황을 찾을 수 없습니다.' });
    }

    // 모든 노드를 DB에서 처리
    const currentNodeId = progress.last_node_id;
    let nextNodeId: number | undefined;
    let selectedChoice: any = null;
    
    // DB에서 현재 노드 조회
    console.log('DB에서 현재 노드 조회:', currentNodeId);
    console.log('사용자 진행상황:', progress);
    
    const currentMainStoryNode = await prisma.mainStory.findUnique({
      where: { node_id: currentNodeId }
    });
    
    if (!currentMainStoryNode) {
      console.log('DB에서 노드를 찾을 수 없음, STORY_NODES에서 처리 시도');
      console.log('DB에 있는 모든 노드 ID들:', await prisma.mainStory.findMany({ select: { node_id: true } }));
      // DB에서 찾을 수 없으면 기존 STORY_NODES 로직 사용
      const currentNode = STORY_NODES[currentNodeId];
      if (!currentNode) {
        return res.status(404).json({ error: '현재 스토리 노드를 찾을 수 없습니다.' });
      }
      
      // STORY_NODES 처리 로직 (기존 코드)
      if (currentNodeId >= 400) {
        console.log('STORY_NODES 메인 스토리 처리');
        nextNodeId = Number(choiceId);
      } else {
        console.log('STORY_NODES 일반 노드 처리');
        nextNodeId = Number(choiceId);
      }
    } else {
      // DB에서 찾은 경우: 현재 노드의 선택지에서 targetNodeId 찾기
      console.log('DB 메인 스토리에서 선택지 처리');
      
      // 새로운 StoryChoice 테이블에서 선택지 찾기
      selectedChoice = await prisma.storyChoice.findFirst({
        where: {
          story_node_id: currentNodeId,
          id: choiceId
        },
        include: {
          choice_requirements: true
        }
      });
      
      if (!selectedChoice) {
        console.log('선택지 찾기 실패. currentNodeId:', currentNodeId, 'choiceId:', choiceId);
        return res.status(400).json({ error: '유효하지 않은 선택입니다.' });
      }

      // 요구사항 체크 (실제 능력/아이템 검증)
      const requirementsMet = await checkChoiceRequirements(userId, selectedChoice.choice_requirements);
      
      if (!requirementsMet) {
        return res.status(400).json({ error: '선택지 요구사항을 만족하지 않습니다.' });
      }
      
      nextNodeId = selectedChoice.target_node_id || undefined;
      console.log('메인 스토리 다음 노드 ID:', nextNodeId);
      
      // 메인스토리에서 다음 노드가 없으면 에러 반환
      if (!nextNodeId) {
        console.log('메인스토리에서 다음 노드 없음');
        return res.status(404).json({ error: '다음 스토리 노드가 없습니다.' });
      }
    }
    
    
    if (!nextNodeId) {
      console.log('유효하지 않은 선택:', choiceId);
      return res.status(404).json({ error: '유효하지 않은 선택입니다.' });
    }

    // 노드 조회: 메인 스토리 DB에서 조회
    let nextNode: any;
    console.log('메인 스토리 DB에서 노드 조회:', nextNodeId);
    const mainStoryNode = await prisma.mainStory.findUnique({
      where: { node_id: nextNodeId }
    });
      
    if (!mainStoryNode) {
      return res.status(404).json({ error: '다음 스토리 노드를 찾을 수 없습니다.' });
    }
    
    // MainStory를 StoryNode 형식으로 변환
    nextNode = {
      nodeId: mainStoryNode.node_id,
      text: mainStoryNode.text,
      choices: JSON.parse(mainStoryNode.choices),
      rewards: mainStoryNode.rewards ? JSON.parse(mainStoryNode.rewards) : undefined,
      nodeType: mainStoryNode.node_type,
      imageUrl: mainStoryNode.image_url,
      imageAlt: mainStoryNode.image_alt
    };

    // 트랜잭션으로 보상 적용 및 진행상황 업데이트
    const result: { delta: any; investigation_count: number } = await prisma.$transaction(async (tx: any) => {
      const delta: any = {};
      
      // 트랜잭션 내부에서 필요한 데이터 다시 조회
      const currentProgress = await tx.storyProgress.findFirst({
        where: { user_id: userId }
      });
      
      const currentUser = await tx.user.findUnique({
        where: { id: userId }
      });

      // 노드 4에 도착하는 경우: 랜덤 능력 2개를 즉시 부여
      let newTempData = currentProgress?.temp_data;
      
      if (nextNodeId === 4) {
        console.log(`노드 ${nextNodeId} 도착 - 능력 부여 시작`);
        
        // temp_data가 있으면 사용, 없으면 새로 생성
        let selectedAbilityIds: number[] = [];
        
        if (currentProgress?.temp_data) {
          try {
            const tempData = JSON.parse(currentProgress.temp_data);
            selectedAbilityIds = tempData.selectedAbilities || [];
          } catch (e) {
            console.error('temp_data 파싱 실패:', e);
          }
        }
        
        // temp_data가 없거나 비어있으면 랜덤 선택
        if (selectedAbilityIds.length === 0) {
          const abilityPool = [1, 2, 3, 4, 5, 6, 7, 8];
          const shuffled = abilityPool.sort(() => 0.5 - Math.random());
          selectedAbilityIds = shuffled.slice(0, 2);
          
          // 새로운 temp_data 준비
          newTempData = JSON.stringify({
            selectedAbilities: selectedAbilityIds
          });
        }
        
        console.log('선택된 능력 IDs:', selectedAbilityIds);
        delta.abilities = [];
        
        // 능력 부여
        for (const abilityId of selectedAbilityIds) {
          const existingAbility = await tx.userStoryAbility.findFirst({
            where: {
              user_id: userId,
              story_ability_id: abilityId
            }
          });

          if (existingAbility) {
            await tx.userStoryAbility.update({
              where: { id: existingAbility.id },
              data: {
                quantity: existingAbility.quantity + 1
              }
            });
          } else {
            await tx.userStoryAbility.create({
              data: {
                user_id: userId,
                story_ability_id: abilityId,
                quantity: 1
              }
            });
          }

          const storyAbility = await tx.storyAbility.findUnique({
            where: { id: abilityId }
          });

          delta.abilities.push({
            abilityId: abilityId,
            name: storyAbility?.name || 'Unknown'
          });
        }
        
        console.log('능력 부여 완료:', delta.abilities);
      }

      // 진행상황 업데이트: temp_data 처리
      let finalTempData = newTempData;
      
      // 노드 4에서 나가는 경우: temp_data 클리어
      if (currentNodeId === 4) {
        console.log('노드 4 탈출 - temp_data 클리어');
        finalTempData = null;
      }
      // 노드 4가 아닌 다른 노드로 가는 경우: temp_data 클리어
      else if (nextNodeId !== 4) {
        finalTempData = null;
      }
      
      await tx.storyProgress.update({
        where: { id: progress.id },
        data: {
          last_node_id: nextNodeId,
          temp_data: finalTempData
        }
      });

      // "길을 계속 걸어간다" 선택지 처리 - 랜덤 스토리 5개 후 최근 체크포인트로 복귀
      if (selectedChoice && selectedChoice.choice_text === '길을 계속 걸어간다') {
        console.log(`"길을 계속 걸어간다" 선택 - 랜덤 스토리 5개 삽입`);
        
        // 랜덤 스토리 5개 선택
        const allRandomStories = await tx.randomStory.findMany();
        const shuffled = allRandomStories.sort(() => 0.5 - Math.random());
        const selectedStories = shuffled.slice(0, 5);
        
        console.log('선택된 랜덤 스토리들:', selectedStories.map((s: any) => s.title));
        
        // 랜덤 스토리들을 delta에 추가
        delta.randomStories = selectedStories.map((story: any) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          choices: JSON.parse(story.choices),
          outcomes: JSON.parse(story.outcomes)
        }));
        
        // 최근 체크포인트 찾기
        const latestCheckpoint = await tx.userCheckpoint.findFirst({
          where: { user_id: userId },
          orderBy: { saved_at: 'desc' }
        });
        
        if (latestCheckpoint) {
          console.log(`최근 체크포인트: 노드 ${latestCheckpoint.node_id} - ${latestCheckpoint.title}`);
          delta.returnToCheckpoint = {
            nodeId: latestCheckpoint.node_id,
            title: latestCheckpoint.title
          };
        } else {
          console.log('최근 체크포인트 없음 - 노드 300으로 복귀');
          delta.returnToCheckpoint = {
            nodeId: 300,
            title: '체크포인트 1 - 세 갈래 길'
          };
        }
        
        // 랜덤 스토리 완료 후 체크포인트로 복귀하도록 플래그 설정
        delta.shouldReturnEarly = true;
        delta.earlyReturnData = {
          nodeId: nextNodeId,
          title: nextNode.title,
          text: nextNode.text,
          choices: nextNode.choices,
          delta: {
            randomStories: delta.randomStories,
            returnToCheckpoint: delta.returnToCheckpoint
          },
          randomStories: delta.randomStories
        };
      }
      // 체크포인트 도달 전 랜덤 스토리 5개 삽입
      else if (nextNode.nodeType === 'checkpoint') {
        console.log(`체크포인트 ${nextNodeId} 도달 - 랜덤 스토리 5개 삽입`);
        
        // 랜덤 스토리 5개 선택
        const allRandomStories = await tx.randomStory.findMany();
        const shuffled = allRandomStories.sort(() => 0.5 - Math.random());
        const selectedStories = shuffled.slice(0, 5);
        
        console.log('선택된 랜덤 스토리들:', selectedStories.map((s: any) => s.title));
        
        // 랜덤 스토리들을 delta에 추가
        delta.randomStories = selectedStories.map((story: any) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          choices: JSON.parse(story.choices),
          outcomes: JSON.parse(story.outcomes)
        }));
        
        // 체크포인트는 랜덤 스토리 완료 후에 저장되도록 플래그 설정
        delta.checkpointPending = true;
        delta.checkpointNodeId = nextNodeId;
        delta.checkpointNode = nextNode;
        
        // 실제 체크포인트 저장은 랜덤 스토리 완료 후에 처리
        // 트랜잭션 밖에서 Response 반환하도록 플래그 설정
        delta.shouldReturnEarly = true;
        delta.earlyReturnData = {
          nodeId: nextNodeId,
          title: nextNode.title,
          text: nextNode.text,
          choices: nextNode.choices,
          delta: {
            randomStories: delta.randomStories,
            checkpointPending: delta.checkpointPending,
            checkpointNodeId: delta.checkpointNodeId
          },
          randomStories: delta.randomStories
        };
      }

      // 체크포인트 자동 저장 (중복 방지) - 랜덤 스토리 완료 후
      if (nextNode.nodeType === 'checkpoint' && !delta.checkpointPending) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user) {
          // 이미 이 노드에 대한 체크포인트가 있는지 확인
          const existingCheckpoint = await tx.userCheckpoint.findFirst({
            where: { 
              user_id: userId,
              node_id: nextNodeId
            }
          });
          
          // 이미 체크포인트가 있으면 추가 생성하지 않음
          if (existingCheckpoint) {
            console.log(`체크포인트 이미 존재: 노드 ${nextNodeId}`);
            delta.checkpoint = {
              title: existingCheckpoint.title,
              message: '이미 도달한 체크포인트입니다.'
            };
          } else {
            // 현재 유저의 체크포인트 개수 확인
            const checkpointCount = await tx.userCheckpoint.count({
              where: { user_id: userId }
            });
            
            // 체크포인트 제목 생성 (1부터 시작)
            const checkpointNumber = checkpointCount + 1;
            const checkpointTitle = `체크포인트 ${checkpointNumber}`;
            const checkpointDesc = nextNode.text.substring(0, 100) + '...';
            
            await tx.userCheckpoint.create({
              data: {
                user_id: userId,
                node_id: nextNodeId,
                title: checkpointTitle,
                description: checkpointDesc,
                hp: user.hp,
                energy: user.energy,
                gold: user.gold
              }
            });

            console.log(`체크포인트 저장: ${checkpointTitle}`);
            delta.checkpoint = {
              title: checkpointTitle,
              message: '체크포인트 도달. 진행 상황이 저장되었습니다.'
            };
          }
        }
      }

      // 보상 적용
      if (nextNode.rewards) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('사용자를 찾을 수 없습니다.');

        const updates: any = {};
        
        if (nextNode.rewards.hp && currentUser) {
          const newHp = Math.max(0, Math.min(100, currentUser.hp + nextNode.rewards.hp));
          updates.hp = newHp;
          delta.hp = nextNode.rewards.hp;
        }
        
        if (nextNode.rewards.energy && currentUser) {
          const newEnergy = Math.max(0, Math.min(100, currentUser.energy + nextNode.rewards.energy));
          updates.energy = newEnergy;
          delta.energy = nextNode.rewards.energy;
        }
        
        if (nextNode.rewards.gold && currentUser) {
          updates.gold = currentUser.gold + nextNode.rewards.gold;
          delta.gold = nextNode.rewards.gold;
        }

        if (Object.keys(updates).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: updates
          });
        }

        // 스토리 아이템 보상 처리
        if (nextNode.rewards.items) {
          if (!delta.items) delta.items = [];
          
          for (const itemReward of nextNode.rewards.items) {
            // 스토리 아이템 정보 조회
            const storyItem = await tx.storyItem.findUnique({
              where: { id: itemReward.itemId }
            });

            const existingStoryItem = await tx.userStoryItem.findFirst({
              where: {
                user_id: userId,
                story_item_id: itemReward.itemId
              }
            });

            if (existingStoryItem) {
              await tx.userStoryItem.update({
                where: { id: existingStoryItem.id },
                data: {
                  quantity: existingStoryItem.quantity + itemReward.quantity
                }
              });
            } else {
              await tx.userStoryItem.create({
                data: {
                  user_id: userId,
                  story_item_id: itemReward.itemId,
                  quantity: itemReward.quantity
                }
              });
            }

            delta.items.push({
              itemId: itemReward.itemId,
              name: storyItem?.name || 'Unknown Item',
              qty: itemReward.quantity
            });
          }
        }

        // 스토리 능력 보상 처리
        if (nextNode.rewards.abilities) {
          if (!delta.abilities) delta.abilities = [];
          
          for (const abilityReward of nextNode.rewards.abilities) {
            // 이미 보유한 스토리 능력인지 확인
            const existingAbility = await tx.userStoryAbility.findFirst({
              where: {
                user_id: userId,
                story_ability_id: abilityReward.abilityId
              }
            });

            if (existingAbility) {
              // 이미 있으면 quantity 증가
              await tx.userStoryAbility.update({
                where: { id: existingAbility.id },
                data: {
                  quantity: existingAbility.quantity + 1
                }
              });
            } else {
              // 없으면 새로 생성
              await tx.userStoryAbility.create({
                data: {
                  user_id: userId,
                  story_ability_id: abilityReward.abilityId,
                  quantity: 1
                }
              });
            }

            const storyAbility = await tx.storyAbility.findUnique({
              where: { id: abilityReward.abilityId }
            });

            delta.abilities.push({
              abilityId: abilityReward.abilityId,
              name: storyAbility?.name || 'Unknown'
            });
          }
        }
      }

      return { delta, investigation_count: currentProgress?.investigation_count || 0 };
    });

    // 랜덤 스토리가 필요한 경우 조기 반환
    if (result.delta.shouldReturnEarly) {
      return res.status(200).json(result.delta.earlyReturnData);
    }

    return res.status(200).json({
      nodeId: nextNodeId,
      delta: result.delta,
      investigation_count: result.investigation_count
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Choose story option error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const autosaveStory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { last_node_id } = autosaveSchema.parse(req.body);

    await prisma.storyProgress.updateMany({
      where: { user_id: userId },
      data: { last_node_id }
    });

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Autosave story error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const enterStoryDay = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { day } = req.params;
    const dayNum = parseInt(day);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
      return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
    }

    // 기존 진행상황 조회
    let progress = await prisma.storyProgress.findFirst({
      where: { user_id: userId }
    });

    // 튜토리얼 노드부터 시작 (1번부터 시작)
    const tutorialNode = await prisma.mainStory.findUnique({
      where: { node_id: 1 }
    });
    
    const startNodeId = tutorialNode ? 1 : 400; // 튜토리얼이 있으면 1, 없으면 400으로 fallback
    console.log('게임 시작 노드 ID:', startNodeId);

    if (progress) {
      // 게임 시작 시에는 조사 기회를 소모하지 않음 (단순히 노드만 업데이트)
      await prisma.storyProgress.update({
        where: { id: progress.id },
        data: {
          current_chapter: dayNum,
          last_node_id: startNodeId
          // investigation_count는 변경하지 않음
        }
      });

      // 시작 노드 정보 가져오기
      const startNode = await prisma.mainStory.findUnique({
        where: { node_id: startNodeId }
      });

      return res.status(200).json({
        message: `${dayNum}일차 게임을 시작합니다.`,
        progress: {
          current_chapter: dayNum,
          last_node_id: startNodeId,
          investigation_count: progress.investigation_count
        },
        startNode: startNode ? {
          nodeId: startNode.node_id,
          text: startNode.text,
          choices: JSON.parse(startNode.choices || '[]')
        } : null,
        actionPointsRemaining: progress.investigation_count
      });
    } else {
      // 첫 진입 - 조사 기회 3회 부여
      const newProgress = await prisma.storyProgress.create({
        data: {
          user_id: userId,
          current_chapter: dayNum,
          last_node_id: startNodeId,
          investigation_count: MAX_ACTION_POINTS - 1 // 시작하면서 1회 소모
        }
      });

      // 시작 노드 정보 가져오기
      const startNode = await prisma.mainStory.findUnique({
        where: { node_id: startNodeId }
      });

      return res.status(200).json({
        message: `${dayNum}일차 게임을 시작합니다.`,
        progress: {
          current_chapter: dayNum,
          last_node_id: startNodeId,
          investigation_count: newProgress.investigation_count
        },
        startNode: startNode ? {
          nodeId: startNode.node_id,
          text: startNode.text,
          choices: JSON.parse(startNode.choices || '[]')
        } : null,
        actionPointsRemaining: newProgress.investigation_count
      });
    }

  } catch (error) {
    console.error('Enter story day error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 랜덤 스토리 완료 후 체크포인트 저장
export const completeRandomStoriesAndSaveCheckpoint = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { checkpointNodeId } = req.body;

    if (!checkpointNodeId) {
      return res.status(400).json({ error: '체크포인트 노드 ID가 필요합니다.' });
    }

    console.log(`랜덤 스토리 완료 - 체크포인트 ${checkpointNodeId} 저장`);

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 체크포인트 노드 조회
      const checkpointNode = await tx.mainStory.findUnique({
        where: { node_id: checkpointNodeId }
      });

      if (!checkpointNode) {
        throw new Error('체크포인트 노드를 찾을 수 없습니다.');
      }

      // 이미 이 노드에 대한 체크포인트가 있는지 확인
      const existingCheckpoint = await tx.userCheckpoint.findFirst({
        where: { 
          user_id: userId,
          node_id: checkpointNodeId
        }
      });

      let delta: any = {};

      if (existingCheckpoint) {
        console.log(`체크포인트 이미 존재: 노드 ${checkpointNodeId}`);
        delta.checkpoint = {
          title: existingCheckpoint.title,
          message: '이미 도달한 체크포인트입니다.'
        };
      } else {
        // 현재 유저의 체크포인트 개수 확인
        const checkpointCount = await tx.userCheckpoint.count({
          where: { user_id: userId }
        });
        
        // 체크포인트 제목 생성 (1부터 시작)
        const checkpointNumber = checkpointCount + 1;
        const checkpointTitle = `체크포인트 ${checkpointNumber}`;
        const checkpointDesc = checkpointNode.text.substring(0, 100) + '...';
        
        await tx.userCheckpoint.create({
          data: {
            user_id: userId,
            node_id: checkpointNodeId,
            title: checkpointTitle,
            description: checkpointDesc,
            hp: user.hp,
            energy: user.energy,
            gold: user.gold
          }
        });

        console.log(`체크포인트 저장: ${checkpointTitle}`);
        delta.checkpoint = {
          title: checkpointTitle,
          message: '체크포인트 도달. 진행 상황이 저장되었습니다.'
        };
      }

      return {
        checkpoint: delta.checkpoint
      };
    });

    return res.status(200).json({
      message: '랜덤 스토리 완료 및 체크포인트 저장',
      delta: result
    });

  } catch (error) {
    console.error('Complete random stories and save checkpoint error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// 랜덤 스토리 완료 후 최근 체크포인트로 복귀
export const completeRandomStoriesAndReturnToCheckpoint = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { returnToCheckpoint } = req.body;

    if (!returnToCheckpoint || !returnToCheckpoint.nodeId) {
      return res.status(400).json({ error: '복귀할 체크포인트 정보가 필요합니다.' });
    }

    console.log(`랜덤 스토리 완료 - 체크포인트 ${returnToCheckpoint.nodeId}로 복귀`);

    const result = await prisma.$transaction(async (tx: any) => {
      // 진행상황 업데이트
      await tx.storyProgress.updateMany({
        where: { user_id: userId },
        data: {
          last_node_id: returnToCheckpoint.nodeId
        }
      });

      // 체크포인트 노드 정보 조회
      const checkpointNode = await tx.mainStory.findUnique({
        where: { node_id: returnToCheckpoint.nodeId },
        include: {
          story_choices: {
            orderBy: { order_index: 'asc' }
          }
        }
      });

      if (!checkpointNode) {
        throw new Error('체크포인트 노드를 찾을 수 없습니다.');
      }

      // StoryNode 형식으로 변환
      const nodeData = {
        nodeId: checkpointNode.node_id,
        title: checkpointNode.title,
        text: checkpointNode.text,
        choices: checkpointNode.story_choices.map((choice: any) => ({
          id: choice.id,
          targetNodeId: choice.target_node_id,
          label: choice.choice_text
        })),
        nodeType: checkpointNode.node_type,
        imageUrl: checkpointNode.image_url,
        imageAlt: checkpointNode.image_alt
      };

      return {
        node: nodeData,
        message: `체크포인트 "${returnToCheckpoint.title}"로 복귀했습니다.`
      };
    });

    return res.status(200).json({
      message: result.message,
      node: result.node
    });

  } catch (error) {
    console.error('Complete random stories and return to checkpoint error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 