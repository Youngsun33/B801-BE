const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTutorialFinal() {
  try {
    console.log('🎮 최종 정확한 튜토리얼 스토리로 수정 시작...');

    // 기존 튜토리얼 노드들 삭제 (노드 1-6)
    await prisma.mainStory.deleteMany({
      where: {
        node_id: {
          in: [1, 2, 3, 4, 5, 6]
        }
      }
    });

    // 기존 튜토리얼 선택지들 삭제
    await prisma.storyChoice.deleteMany({
      where: {
        story_node_id: {
          in: [1, 2, 3, 4, 5, 6]
        }
      }
    });

    console.log('기존 튜토리얼 노드들 삭제 완료');

    // 정확한 튜토리얼 노드들 생성
    const tutorialNodes = [
      {
        node_id: 1,
        title: "시작",
        text: "핵 전쟁으로 황폐화된 서울. 하지만 아직까지 이 땅에는 자리를 잡고 살아가는 무리들이 있습니다.\n\n그건 당신에게도 해당되는 말이었죠. 우리는 김필일 필두로 모여 하나의 집단을 형성했습니다.",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 1, targetNodeId: 2, label: "핵 전쟁에 대해 더 자세히 알고 싶습니다." },
          { id: 2, targetNodeId: 3, label: "이미 알고 있는 이야기니 빠르게 갑시다." }
        ]),
        rewards: null,
        position_x: 100,
        position_y: 100
      },
      {
        node_id: 2,
        title: "핵전쟁 상세",
        text: "핵 전쟁이 발발한지는 어언 3년 전. 계기야 으레 전쟁들이 그렇듯 오랫동안 묵힌 여러 감정들이었습니다. 지금에서는 별로 중요하지 않은 일이니 잠시 넘어갈까요. 우리는 모종의 이유로 혼자가 되었습니다. 전쟁 전부터 혼자였을지도 모르겠지만요. 다행인 건 핵폭탄이 터진 상공이 서울은 아니었다는 겁니다. 꽤나 먼 거리에서 터진 폭탄으로도 이렇게 황폐화가 되었는데, 터진 자리는 어떨까요? 사람들은 폭탄이 터진 수 킬로미터의 거리를 봉쇄해 오프(off)라고 부르기 시작했습니다. 당연하겠지만 오프 안으로 들어가는 건 미친 짓입니다. 당신의 목숨이 아깝지 않다면 시도해 보는 것도 괜찮겠네요.",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 3, targetNodeId: 3, label: "빠르게 요약 좀 해 주시겠어요?" },
          { id: 4, targetNodeId: 3, label: "이미 알고 있는 이야기니 빠르게 갑시다." }
        ]),
        rewards: null,
        position_x: 200,
        position_y: 100
      },
      {
        node_id: 3,
        title: "요약",
        text: "모두 다 당신을 생각해서 드리는 말이니 조금만 더 집중해 주세요. 혼란과 어둠으로 뒤덮인 서울은 말 그대로의 무법도시였습니다. 소문에 따르면 무장 강도, 군대, 미친 과학자, 전염병 등의 천지였고요. 당신이 지금까지 목숨을 붙이고 있는 건 굉장한 천운일지도 모르겠습니다.",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 5, targetNodeId: 4, label: "지금 나는 어떤 상태죠?" }
        ]),
        rewards: null,
        position_x: 300,
        position_y: 150
      },
      {
        node_id: 4,
        title: "능력 배부",
        text: "당신의 현재 상태를 확인해보니 특별한 능력들이 보입니다. 랜덤으로 2개의 능력이 부여됩니다.",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 6, targetNodeId: 5, label: "그렇군요. 이제 출발하죠." }
        ]),
        rewards: JSON.stringify({ ability: "random_2" }),
        position_x: 400,
        position_y: 150
      },
      {
        node_id: 5,
        title: "김필일의 도움",
        text: "\"잠깐. 빈손으로 그냥 가려고?\"\n\n뒤에서 들려오는 목소리는 아주 익숙합니다. 그야 김필일의 목소리인걸요. 그는 당신의 손에 지폐 몇 장을 쥐여줍니다. 나름의 성의 표시겠죠.",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 7, targetNodeId: 300, label: "정말 출발합시다." }
        ]),
        rewards: JSON.stringify({ money: 1 }),
        position_x: 500,
        position_y: 150
      }
    ];

    // 튜토리얼 노드들 생성
    for (const node of tutorialNodes) {
      await prisma.mainStory.create({
        data: node
      });
      console.log(`튜토리얼 노드 ${node.node_id} 생성: ${node.title}`);
    }

    // 튜토리얼 선택지들을 StoryChoice 테이블에 추가
    const tutorialChoices = [
      // 노드 1의 선택지들
      {
        story_node_id: 1,
        choice_text: "핵 전쟁에 대해 더 자세히 알고 싶습니다.",
        target_node_id: 2,
        order_index: 1,
        is_available: true
      },
      {
        story_node_id: 1,
        choice_text: "이미 알고 있는 이야기니 빠르게 갑시다.",
        target_node_id: 3,
        order_index: 2,
        is_available: true
      },
      // 노드 2의 선택지들
      {
        story_node_id: 2,
        choice_text: "빠르게 요약 좀 해 주시겠어요?",
        target_node_id: 3,
        order_index: 1,
        is_available: true
      },
      {
        story_node_id: 2,
        choice_text: "이미 알고 있는 이야기니 빠르게 갑시다.",
        target_node_id: 3,
        order_index: 2,
        is_available: true
      },
      // 노드 3의 선택지
      {
        story_node_id: 3,
        choice_text: "지금 나는 어떤 상태죠?",
        target_node_id: 4,
        order_index: 1,
        is_available: true
      },
      // 노드 4의 선택지
      {
        story_node_id: 4,
        choice_text: "그렇군요. 이제 출발하죠.",
        target_node_id: 5,
        order_index: 1,
        is_available: true
      },
      // 노드 5의 선택지
      {
        story_node_id: 5,
        choice_text: "정말 출발합시다.",
        target_node_id: 300,
        order_index: 1,
        is_available: true
      }
    ];

    for (const choice of tutorialChoices) {
      await prisma.storyChoice.create({
        data: choice
      });
    }

    console.log('튜토리얼 선택지들 생성 완료');

    console.log('🎉 최종 정확한 튜토리얼 스토리 수정 완료!');
    console.log('  - 튜토리얼 노드: 5개 (노드 1-5)');
    console.log('  - 선택지: 7개');
    console.log('  - 플로우: 시작 → 핵전쟁 상세 → 요약 → 능력 배부 → 김필일 도움 → 세 갈래 길 (노드 300)');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTutorialFinal();
