const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNode400() {
  try {
    console.log('🔍 노드 400 확인 중...');
    
    const node400 = await prisma.mainStory.findUnique({
      where: { node_id: 400 }
    });
    
    if (!node400) {
      console.log('❌ 노드 400이 없습니다.');
      return;
    }
    
    console.log('✅ 노드 400 정보:');
    console.log(`  - 제목: ${node400.title}`);
    console.log(`  - 텍스트: ${node400.text}`);
    console.log(`  - 타입: ${node400.node_type}`);
    console.log(`  - choices: ${node400.choices}`);
    console.log(`  - rewards: ${node400.rewards}`);
    
    // StoryChoice 테이블에서 선택지 확인
    const storyChoices = await prisma.storyChoice.findMany({
      where: { story_node_id: 400 },
      orderBy: { order_index: 'asc' }
    });
    
    console.log(`\n📋 노드 400의 선택지들 (${storyChoices.length}개):`);
    for (const choice of storyChoices) {
      console.log(`  - "${choice.choice_text}" → 노드 ${choice.target_node_id}`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNode400();
