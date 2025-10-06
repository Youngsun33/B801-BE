const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTutorialStories() {
  try {
    console.log('🎮 튜토리얼 스토리 추가 시작...');

    // 기존 튜토리얼 노드들 삭제 (노드 1-4)
    await prisma.mainStory.deleteMany({
      where: {
        node_id: {
          in: [1, 2, 3, 4]
        }
      }
    });

    console.log('기존 튜토리얼 노드들 삭제 완료');

    // 튜토리얼 노드들 생성
    const tutorialNodes = [
      {
        node_id: 1,
        title: "시작",
        text: "당신은 서울의 한 골목길에서 눈을 뜹니다. 주변은 전쟁의 여파로 황폐해져 있고, 사람들의 얼굴에는 절망이 가득합니다. 이런 상황에서 당신은 어떻게 행동할까요?",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 1, targetNodeId: 2, label: "주변을 둘러본다" },
          { id: 2, targetNodeId: 3, label: "길을 걷는다" }
        ]),
        rewards: null,
        position_x: 100,
        position_y: 100
      },
      {
        node_id: 2,
        title: "주변 탐색",
        text: "주변을 둘러보니 버려진 가방이 하나 보입니다. 가방 안에는 몇 가지 물건들이 들어있네요. 무엇을 가져갈까요?",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 3, targetNodeId: 4, label: "돈을 가져간다" },
          { id: 4, targetNodeId: 4, label: "음식을 가져간다" },
          { id: 5, targetNodeId: 4, label: "무시하고 간다" }
        ]),
        rewards: JSON.stringify({ money: 1 }),
        position_x: 200,
        position_y: 100
      },
      {
        node_id: 3,
        title: "길을 걷다",
        text: "길을 걷다 보니 한 노인이 당신을 불러세웁니다. '젊은이, 이곳은 위험한 곳이니 조심하거라. 특히 능력이 없는 자는 더욱 조심해야 한다네.'",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 6, targetNodeId: 4, label: "조언을 듣는다" },
          { id: 7, targetNodeId: 4, label: "무시하고 간다" }
        ]),
        rewards: null,
        position_x: 200,
        position_y: 200
      },
      {
        node_id: 4,
        title: "능력 선택",
        text: "당신은 이제 자신의 능력을 선택해야 합니다. 어떤 능력을 우선적으로 개발할까요? (랜덤으로 2개 능력이 부여됩니다)",
        node_type: "main",
        route_name: "tutorial",
        choices: JSON.stringify([
          { id: 8, targetNodeId: 300, label: "능력을 선택했다" }
        ]),
        rewards: JSON.stringify({ ability: "random_2" }),
        position_x: 300,
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
        choice_text: "주변을 둘러본다",
        target_node_id: 2,
        order_index: 1,
        is_available: true
      },
      {
        story_node_id: 1,
        choice_text: "길을 걷는다",
        target_node_id: 3,
        order_index: 2,
        is_available: true
      },
      // 노드 2의 선택지들
      {
        story_node_id: 2,
        choice_text: "돈을 가져간다",
        target_node_id: 4,
        order_index: 1,
        is_available: true
      },
      {
        story_node_id: 2,
        choice_text: "음식을 가져간다",
        target_node_id: 4,
        order_index: 2,
        is_available: true
      },
      {
        story_node_id: 2,
        choice_text: "무시하고 간다",
        target_node_id: 4,
        order_index: 3,
        is_available: true
      },
      // 노드 3의 선택지들
      {
        story_node_id: 3,
        choice_text: "조언을 듣는다",
        target_node_id: 4,
        order_index: 1,
        is_available: true
      },
      {
        story_node_id: 3,
        choice_text: "무시하고 간다",
        target_node_id: 4,
        order_index: 2,
        is_available: true
      },
      // 노드 4의 선택지
      {
        story_node_id: 4,
        choice_text: "능력을 선택했다",
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

    console.log('🎉 튜토리얼 스토리 추가 완료!');
    console.log('  - 튜토리얼 노드: 4개 (노드 1-4)');
    console.log('  - 선택지: 8개');
    console.log('  - 플로우: 시작 → 탐색/걷기 → 능력 선택 → 세 갈래 길 (노드 300)');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTutorialStories();
