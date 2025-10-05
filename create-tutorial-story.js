const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTutorialStory() {
  try {
    console.log('🔧 튜토리얼 스토리 생성 중...');
    
    // 기존 튜토리얼 노드들 삭제
    await prisma.storyChoice.deleteMany({
      where: {
        story_node_id: {
          in: [1, 2, 3, 4, 5, 6, 200, 209, 210]
        }
      }
    });
    
    await prisma.mainStory.deleteMany({
      where: {
        node_id: {
          in: [1, 2, 3, 4, 5, 6, 200, 209, 210]
        }
      }
    });
    
    console.log('✅ 기존 튜토리얼 노드들 삭제');
    
    // 새로운 튜토리얼 노드들 생성
    const tutorialNodes = [
      {
        node_id: 1,
        title: '핵 전쟁 배경',
        text: '핵 전쟁으로 황폐화된 서울. 하지만 아직까지 이 땅에는 자리를 잡고 살아가는 무리들이 있습니다.\n\n그건 당신에게도 해당되는 말이었죠. 우리는 김필일 필두로 모여 하나의 집단을 형성했습니다.',
        choices: '[{"id": 11, "targetNodeId": 2, "label": "핵 전쟁에 대해 더 자세히 알고 싶습니다."}, {"id": 12, "targetNodeId": 4, "label": "이미 알고 있는 이야기니 빠르게 갑시다."}]',
        rewards: null,
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 2,
        title: '핵 전쟁 상세',
        text: '핵 전쟁이 발발한지는 어언 3년 전. 계기야 으레 전쟁들이 그렇듯 오랫동안 묵힌 여러 감정들이었습니다. 지금에서는 별로 중요하지 않은 일이니 잠시 넘어갈까요. 우리는 모종의 이유로 혼자가 되었습니다. 전쟁 전부터 혼자였을지도 모르겠지만요. 다행인 건 핵폭탄이 터진 상공이 서울은 아니었다는 겁니다. 꽤나 먼 거리에서 터진 폭탄으로도 이렇게 황폐화가 되었는데, 터진 자리는 어떨까요? 사람들은 폭탄이 터진 수 킬로미터의 거리를 봉쇄해 오프(off)라고 부르기 시작했습니다. 당연하겠지만 오프 안으로 들어가는 건 미친 짓입니다. 당신의 목숨이 아깝지 않다면 시도해 보는 것도 괜찮겠네요.',
        choices: '[{"id": 21, "targetNodeId": 3, "label": "빠르게 요약 좀 해 주시겠어요?"}, {"id": 22, "targetNodeId": 4, "label": "이미 알고 있는 이야기니 빠르게 갑시다."}]',
        rewards: null,
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 3,
        title: '요약',
        text: '모두 다 당신을 생각해서 드리는 말이니 조금만 더 집중해 주세요. 혼란과 어둠으로 뒤덮인 서울은 말 그대로의 무법도시였습니다. 소문에 따르면 무장 강도, 군대, 미친 과학자, 전염병 등의 천지였고요. 당신이 지금까지 목숨을 붙이고 있는 건 굉장한 천운일지도 모르겠습니다.',
        choices: '[{"id": 31, "targetNodeId": 4, "label": "지금 나는 어떤 상태죠?"}]',
        rewards: null,
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 4,
        title: '능력 선택',
        text: '관찰력 / 근력 / 민첩함 / 은신술 / 손재주 / 언변술 / 매력 / 직감 / 권총\n\n관찰력 - 당신의 장점은 눈이 아주 좋다는 것입니다. 다른 사람이 쉽게 찾지 못할 것들도 매의 눈으로 찾아내기 마련이죠.\n근력 - 당신의 장점은 힘이 아주 세다는 겁니다. 이 같은 세상에서 힘이란 무엇과도 바꿀 수 없는 능력입니다.\n민첩함 - 당신의 장점은 다리가 아주 빠르다는 겁니다. 웬만한 사람들은 당신이 마음만 먹으면 모두 따돌릴 수 있습니다. 물론 기계 앞에서는 무용지물이겠지만요.\n은신술 - 당신은 인기척을 숨기는 데 달인입니다. 이상한 피에로 옷만 입지 않는 이상 당신이 마음만 먹으면 몰래 다니는 것쯤이야 아주 쉬운 일입니다.\n손재주 - 당신은 손으로 만드는 모든 것에 재능이 있습니다. 만들기, 기계 수리, 많게는 도박까지……. 뭐, 거기까지 쓸 일이 있겠어요.\n언변술 - 당신은 말의 귀재입니다. 입 하나로 잘하면 차까지 살 수 있을 정도예요. 조금 더 노력하면 나라까지 얻을 수 있지 않겠어요?\n매력 - 당신의 장점은 멋진 외모! 모두가 당신을 보는 순간 깊은 매력에 빠지게 될 겁니다.\n직감 - 하잘것없어 보여도 세상 무엇보다도 귀한 재능이 바로 직감입니다. 당신은 빠른 눈치로 모든 장애물을 헤쳐 나갈 수 있을 겁니다.\n권총 - 우리의 소지품 중 하나죠. 운 좋게도 남아 있는 것을 챙겨왔습니다. 가장 귀중한 무기, 권총입니다.\n\n랜덤 2개 능력 배부',
        choices: '[]', // 런타임에 랜덤 2개 추가
        rewards: '{"abilities": []}', // 런타임에 랜덤 2개 추가
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 5,
        title: '권총 획득',
        text: '그렇군요. 이제 출발하죠.\n\n"잠깐. 빈손으로 그냥 가려고?"\n\n뒤에서 들려오는 목소리는 아주 익숙합니다. 그야 김필일의 목소리인걸요. 그는 당신의 손에 지폐 몇 장을 쥐여줍니다. 나름의 성의 표시겠죠.',
        choices: '[{"id": 51, "targetNodeId": 6, "label": "정말 출발합시다."}]',
        rewards: '{"items": [{"itemId": 5, "quantity": 1}], "gold": 100}', // 권총 + 돈 100
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 6,
        title: '출발',
        text: '정말 출발합시다.',
        choices: '[{"id": 61, "targetNodeId": 300, "label": "체크포인트 1로 이동"}]',
        rewards: null,
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      }
    ];
    
    // 노드들 생성
    for (const node of tutorialNodes) {
      await prisma.mainStory.create({
        data: node
      });
      console.log(`✅ 노드 ${node.node_id} 생성: ${node.title}`);
    }
    
    // StoryChoice 테이블에 선택지 추가
    const choices = [
      // 노드 1의 선택지
      { story_node_id: 1, choice_text: '핵 전쟁에 대해 더 자세히 알고 싶습니다.', target_node_id: 2, order_index: 0, is_available: true },
      { story_node_id: 1, choice_text: '이미 알고 있는 이야기니 빠르게 갑시다.', target_node_id: 4, order_index: 1, is_available: true },
      
      // 노드 2의 선택지
      { story_node_id: 2, choice_text: '빠르게 요약 좀 해 주시겠어요?', target_node_id: 3, order_index: 0, is_available: true },
      { story_node_id: 2, choice_text: '이미 알고 있는 이야기니 빠르게 갑시다.', target_node_id: 4, order_index: 1, is_available: true },
      
      // 노드 3의 선택지
      { story_node_id: 3, choice_text: '지금 나는 어떤 상태죠?', target_node_id: 4, order_index: 0, is_available: true },
      
      // 노드 5의 선택지
      { story_node_id: 5, choice_text: '정말 출발합시다.', target_node_id: 6, order_index: 0, is_available: true },
      
      // 노드 6의 선택지
      { story_node_id: 6, choice_text: '체크포인트 1로 이동', target_node_id: 300, order_index: 0, is_available: true }
    ];
    
    for (const choice of choices) {
      await prisma.storyChoice.create({
        data: choice
      });
    }
    
    console.log('✅ StoryChoice 선택지들 추가 완료');
    
    // 체크포인트 1 (노드 300) 업데이트
    const checkpointNode = await prisma.mainStory.findUnique({
      where: { node_id: 300 }
    });
    
    if (checkpointNode) {
      await prisma.mainStory.update({
        where: { node_id: 300 },
        data: {
          title: '체크포인트 1 - 세 갈래 길',
          text: '길을 나선 당신은 당장 눈앞에 있는 세 갈래 길에 들어섭니다. 왼쪽 길은 우리가 익히 다니던 통로로, 위험한 것은 존재하지 않는다는 걸 알고 있습니다. 가운데 길은…… 어땠었죠? 기억이 잘 나지 않습니다. 다만 오른쪽 길은 확실히 기억나네요. 김필일이 위험하니 가급적 들어서지 말라 당부한 곳이었습니다.',
          choices: '[{"id": 301, "targetNodeId": 650, "label": "왼쪽 길"}, {"id": 302, "targetNodeId": 653, "label": "가운데 길"}, {"id": 303, "targetNodeId": 656, "label": "오른쪽 길"}]'
        }
      });
      
      // 체크포인트 1 선택지들 추가
      const checkpointChoices = [
        { story_node_id: 300, choice_text: '왼쪽 길', target_node_id: 650, order_index: 0, is_available: true }, // 루트 1
        { story_node_id: 300, choice_text: '가운데 길', target_node_id: 653, order_index: 1, is_available: true }, // 루트 2
        { story_node_id: 300, choice_text: '오른쪽 길', target_node_id: 656, order_index: 2, is_available: true }  // 루트 3
      ];
      
      // 기존 선택지 삭제
      await prisma.storyChoice.deleteMany({
        where: { story_node_id: 300 }
      });
      
      // 새 선택지 추가
      for (const choice of checkpointChoices) {
        await prisma.storyChoice.create({
          data: choice
        });
      }
      
      console.log('✅ 체크포인트 1 (노드 300) 업데이트 완료');
    }
    
    // 게임 시작 노드를 1번으로 변경
    console.log('\n🎮 게임 시작 노드를 1번으로 설정...');
    
    console.log('\n🎉 튜토리얼 스토리 생성 완료!');
    console.log('📊 생성된 노드들:');
    console.log('  1번: 핵 전쟁 배경');
    console.log('  2번: 핵 전쟁 상세');
    console.log('  3번: 요약');
    console.log('  4번: 능력 선택 (랜덤 2개)');
    console.log('  5번: 권총 획득 + 돈 +100');
    console.log('  6번: 출발');
    console.log('  300번: 체크포인트 1 (세 갈래 길)');
    console.log('    → 650번: 루트 1');
    console.log('    → 653번: 루트 2');
    console.log('    → 656번: 루트 3');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTutorialStory();
