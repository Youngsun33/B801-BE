const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addNode400Choices() {
  try {
    console.log('🔧 노드 400 선택지 추가 중...');
    
    // 노드 400 확인
    const node400 = await prisma.mainStory.findUnique({
      where: { node_id: 400 }
    });
    
    if (!node400) {
      console.log('❌ 노드 400이 없습니다.');
      return;
    }
    
    console.log('✅ 노드 400 확인됨');
    
    // 기존 StoryChoice 삭제
    await prisma.storyChoice.deleteMany({
      where: { story_node_id: 400 }
    });
    
    // 노드 400에 선택지 추가 (능력 선택 후 다음으로)
    const choices = [
      {
        story_node_id: 400,
        choice_text: '그렇군요. 이제 출발하죠.',
        target_node_id: 652, // 다음 노드로 연결
        order_index: 0,
        is_available: true
      }
    ];
    
    for (const choice of choices) {
      await prisma.storyChoice.create({
        data: choice
      });
      console.log(`✅ 선택지 추가: "${choice.choice_text}" → 노드 ${choice.target_node_id}`);
    }
    
    console.log('\n🎉 노드 400 선택지 추가 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNode400Choices();
