const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNode200Choices() {
  try {
    console.log('🔍 노드 200번 선택지 확인...');
    
    // 노드 200번 정보
    const node = await prisma.mainStory.findUnique({
      where: { node_id: 200 }
    });
    
    if (!node) {
      console.log('❌ 노드 200번 없음');
      return;
    }
    
    console.log('✅ 노드 200번 정보:');
    console.log(`  - 제목: ${node.title}`);
    console.log(`  - 텍스트: ${node.text.substring(0, 100)}...`);
    console.log(`  - choices JSON: ${node.choices}`);
    
    // StoryChoice 테이블에서 선택지 확인
    const storyChoices = await prisma.storyChoice.findMany({
      where: { story_node_id: 200 },
      orderBy: { order_index: 'asc' }
    });
    
    console.log(`\n📋 StoryChoice 테이블 선택지 (${storyChoices.length}개):`);
    storyChoices.forEach((choice, index) => {
      console.log(`  ${index + 1}. "${choice.choice_text}" -> 노드 ${choice.target_node_id}`);
    });
    
    // JSON choices 파싱
    try {
      const jsonChoices = JSON.parse(node.choices || '[]');
      console.log(`\n📋 JSON choices (${jsonChoices.length}개):`);
      jsonChoices.forEach((choice, index) => {
        if (typeof choice === 'string') {
          console.log(`  ${index + 1}. "${choice}"`);
        } else if (choice && typeof choice === 'object') {
          console.log(`  ${index + 1}. "${choice.label || choice.text}" -> ${choice.targetNodeId || choice.id}`);
        }
      });
    } catch (error) {
      console.log('\n❌ JSON choices 파싱 실패:', error.message);
    }
    
    // 노드 200번에 선택지가 없다면 추가
    if (storyChoices.length === 0) {
      console.log('\n🔧 노드 200번에 선택지 추가 중...');
      
      // 튜토리얼 선택지들 추가
      const tutorialChoices = [
        {
          story_node_id: 200,
          choice_text: '핵 전쟁에 대해 더 자세히 알고 싶습니다.',
          target_node_id: 201,
          order_index: 0,
          is_available: true
        },
        {
          story_node_id: 200,
          choice_text: '이미 알고 있는 이야기니 빠르게 갑시다.',
          target_node_id: 209,
          order_index: 1,
          is_available: true
        }
      ];
      
      for (const choice of tutorialChoices) {
        await prisma.storyChoice.create({
          data: choice
        });
      }
      
      console.log('✅ 노드 200번 선택지 추가 완료');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNode200Choices();
