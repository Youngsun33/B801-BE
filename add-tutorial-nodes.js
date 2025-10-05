const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTutorialNodes() {
  try {
    console.log('🔧 튜토리얼 노드들 추가 중...');
    
    // 튜토리얼 노드 데이터
    const tutorialNodes = [
      {
        node_id: 200,
        title: '튜토리얼 - 능력 선택',
        text: '당신은 몇 가지 특별한 능력을 가지고 있습니다. 이제 그 중 2가지를 선택해야 합니다.\n\n각 능력은 당신의 여정에서 큰 도움이 될 것입니다. 신중하게 선택하세요.',
        choices: '[]', // 빈 배열 - 런타임에 랜덤 2개 추가
        rewards: '{"abilities": []}', // 런타임에 랜덤 2개 추가
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 209,
        title: '튜토리얼 - 권총 획득',
        text: '우리의 소지품 중 하나죠. 운 좋게도 남아 있는 것을 챙겨왔습니다. 가장 귀중한 무기, 권총입니다.\n\n권총을 획득했습니다!',
        choices: '[{"id": 2091, "targetNodeId": 210, "label": "그렇군요. 이제 출발하죠."}]',
        rewards: '{"items": [{"itemId": 5, "quantity": 1}]}', // 권총 아이템
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      },
      {
        node_id: 210,
        title: '튜토리얼 - 출발 준비',
        text: '"잠깐. 빈손으로 그냥 가려고?"\n\n뒤에서 들려오는 목소리는 아주 익숙합니다. 그야 김필일의 목소리인걸요. 그는 당신의 손에 지폐 몇 장을 쥐여줍니다. 나름의 성의 표시겠죠.\n\n정말 출발합시다.',
        choices: '[{"id": 2101, "targetNodeId": 400, "label": "좋아, 출발!"}]', // 메인 스토리로 연결
        rewards: '{"gold": 100}',
        node_type: 'tutorial',
        route_name: null,
        position_x: null,
        position_y: null
      }
    ];
    
    // 튜토리얼 노드들 추가
    for (const node of tutorialNodes) {
      try {
        await prisma.mainStory.create({
          data: node
        });
        console.log(`✅ 노드 ${node.node_id} 추가: ${node.title}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ 노드 ${node.node_id} 이미 존재: ${node.title}`);
        } else {
          console.error(`❌ 노드 ${node.node_id} 추가 실패:`, error.message);
        }
      }
    }
    
    // StoryChoice 테이블에도 추가
    console.log('\n🔧 StoryChoice 테이블에 선택지 추가 중...');
    
    // 노드 209의 선택지
    try {
      await prisma.storyChoice.create({
        data: {
          story_node_id: 209,
          choice_text: '그렇군요. 이제 출발하죠.',
          target_node_id: 210,
          order_index: 0,
          is_available: true
        }
      });
      console.log('✅ 노드 209 선택지 추가');
    } catch (error) {
      console.log('⚠️ 노드 209 선택지 이미 존재');
    }
    
    // 노드 210의 선택지
    try {
      await prisma.storyChoice.create({
        data: {
          story_node_id: 210,
          choice_text: '좋아, 출발!',
          target_node_id: 400,
          order_index: 0,
          is_available: true
        }
      });
      console.log('✅ 노드 210 선택지 추가');
    } catch (error) {
      console.log('⚠️ 노드 210 선택지 이미 존재');
    }
    
    console.log('\n🎉 튜토리얼 노드 추가 완료!');
    console.log('📊 추가된 노드들:');
    console.log('  - 노드 200: 튜토리얼 - 능력 선택');
    console.log('  - 노드 209: 튜토리얼 - 권총 획득');
    console.log('  - 노드 210: 튜토리얼 - 출발 준비');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTutorialNodes();
