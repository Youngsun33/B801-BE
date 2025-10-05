const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugNode400() {
  try {
    console.log('🔍 노드 400번 정보 확인 중...');
    
    // 노드 400번 기본 정보
    const node = await prisma.mainStory.findUnique({
      where: { node_id: 400 }
    });
    
    if (!node) {
      console.log('❌ 노드 400번을 찾을 수 없습니다.');
      return;
    }
    
    console.log('📋 노드 400번 정보:');
    console.log(`  - 제목: ${node.title}`);
    console.log(`  - 타입: ${node.node_type}`);
    console.log(`  - 루트: ${node.route_name}`);
    console.log(`  - 텍스트: ${node.text.substring(0, 100)}...`);
    
    // 선택지들
    const choices = await prisma.storyChoice.findMany({
      where: { story_node_id: 400 },
      orderBy: { order_index: 'asc' }
    });
    
    console.log(`\n🎯 선택지들 (${choices.length}개):`);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. "${choice.choice_text}" -> 노드 ${choice.target_node_id}`);
    });
    
    // 타겟 노드들이 실제로 존재하는지 확인
    console.log('\n🔗 타겟 노드 존재 여부:');
    for (const choice of choices) {
      if (choice.target_node_id) {
        const targetNode = await prisma.mainStory.findUnique({
          where: { node_id: choice.target_node_id }
        });
        const exists = targetNode ? '✅ 존재' : '❌ 없음';
        console.log(`  - 노드 ${choice.target_node_id}: ${exists} ${targetNode ? `(${targetNode.title})` : ''}`);
      }
    }
    
    // 루트 선택 노드들도 확인
    console.log('\n🎮 루트 선택 노드들:');
    const routeNodes = await prisma.mainStory.findMany({
      where: { node_id: { in: [650, 653, 656] } },
      orderBy: { node_id: 'asc' }
    });
    
    for (const routeNode of routeNodes) {
      console.log(`\n📍 ${routeNode.title} (노드 ${routeNode.node_id}):`);
      const routeChoices = await prisma.storyChoice.findMany({
        where: { story_node_id: routeNode.node_id },
        orderBy: { order_index: 'asc' }
      });
      
      routeChoices.forEach((choice, index) => {
        console.log(`  ${index + 1}. "${choice.choice_text}" -> 노드 ${choice.target_node_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNode400();
