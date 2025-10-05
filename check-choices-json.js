const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChoicesJson() {
  try {
    console.log('🔍 노드 400번의 기존 choices JSON 확인 중...');
    
    // 노드 400번의 기존 choices 필드 확인
    const node = await prisma.mainStory.findUnique({
      where: { node_id: 400 }
    });
    
    if (!node) {
      console.log('❌ 노드 400번을 찾을 수 없습니다.');
      return;
    }
    
    console.log('📋 노드 400번의 choices JSON:');
    console.log(node.choices);
    
    // JSON 파싱 시도
    try {
      const parsedChoices = JSON.parse(node.choices || '[]');
      console.log('\n🔍 파싱된 choices:');
      console.log(JSON.stringify(parsedChoices, null, 2));
    } catch (e) {
      console.log('\n❌ JSON 파싱 실패:', e.message);
    }
    
    // 다른 몇 개 노드도 확인
    console.log('\n🔍 다른 노드들 확인:');
    const otherNodes = await prisma.mainStory.findMany({
      where: { node_id: { in: [401, 650, 651, 652] } },
      orderBy: { node_id: 'asc' }
    });
    
    for (const otherNode of otherNodes) {
      console.log(`\n📋 노드 ${otherNode.node_id} (${otherNode.title}):`);
      console.log(`  choices: ${otherNode.choices}`);
      
      // StoryChoice 테이블에서 확인
      const storyChoices = await prisma.storyChoice.findMany({
        where: { story_node_id: otherNode.node_id },
        orderBy: { order_index: 'asc' }
      });
      
      console.log(`  StoryChoice 개수: ${storyChoices.length}`);
      storyChoices.forEach((choice, index) => {
        console.log(`    ${index + 1}. "${choice.choice_text}" -> ${choice.target_node_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChoicesJson();
