const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTutorialStart() {
  try {
    console.log('🔍 튜토리얼 시작 테스트...');
    
    // 튜토리얼 노드 200번 확인
    const tutorialNode = await prisma.mainStory.findUnique({
      where: { node_id: 200 }
    });
    
    if (tutorialNode) {
      console.log('✅ 튜토리얼 노드 200번 존재:');
      console.log(`  - 제목: ${tutorialNode.title}`);
      console.log(`  - 타입: ${tutorialNode.node_type}`);
      console.log(`  - 텍스트: ${tutorialNode.text.substring(0, 100)}...`);
    } else {
      console.log('❌ 튜토리얼 노드 200번 없음');
    }
    
    // 게임 시작 시 어떤 노드가 선택되는지 확인
    const startNodeId = tutorialNode ? 200 : 400;
    console.log(`\n🎮 게임 시작 노드 ID: ${startNodeId}`);
    
    // 튜토리얼 플로우 확인
    console.log('\n📋 튜토리얼 플로우:');
    console.log('200번 (능력 선택) → 209번 (권총 획득) → 210번 (출발 준비) → 400번 (메인 스토리)');
    
    // 각 노드의 연결 확인
    const nodes = [200, 209, 210, 400];
    for (const nodeId of nodes) {
      const node = await prisma.mainStory.findUnique({
        where: { node_id: nodeId }
      });
      
      if (node) {
        const choices = await prisma.storyChoice.findMany({
          where: { story_node_id: nodeId },
          orderBy: { order_index: 'asc' }
        });
        
        console.log(`\n📍 노드 ${nodeId}: ${node.title}`);
        console.log(`  - 선택지 개수: ${choices.length}개`);
        choices.forEach((choice, index) => {
          console.log(`    ${index + 1}. "${choice.choice_text}" → 노드 ${choice.target_node_id}`);
        });
      } else {
        console.log(`\n❌ 노드 ${nodeId}: 없음`);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTutorialStart();
