const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncChoiceIds() {
  try {
    console.log('🔄 선택지 ID 동기화 시작');
    
    // 모든 노드의 선택지 ID 동기화
    const nodes = await prisma.mainStory.findMany({
      where: {
        choices: {
          not: '[]'
        }
      }
    });
    
    for (const node of nodes) {
      console.log(`\n노드 ${node.node_id} 처리 중...`);
      
      // StoryChoice에서 실제 선택지들 가져오기
      const storyChoices = await prisma.storyChoice.findMany({
        where: { story_node_id: node.node_id },
        orderBy: { order_index: 'asc' }
      });
      
      if (storyChoices.length === 0) {
        console.log(`  - StoryChoice 없음, 건너뜀`);
        continue;
      }
      
      // MainStory.choices JSON 업데이트
      const updatedChoices = storyChoices.map(choice => ({
        id: choice.id, // 실제 StoryChoice ID 사용
        targetNodeId: choice.target_node_id,
        label: choice.choice_text
      }));
      
      await prisma.mainStory.update({
        where: { node_id: node.node_id },
        data: {
          choices: JSON.stringify(updatedChoices)
        }
      });
      
      console.log(`  - 선택지 ${storyChoices.length}개 ID 동기화 완료`);
      console.log(`  - 선택지 ID들: ${storyChoices.map(c => c.id).join(', ')}`);
    }
    
    console.log('\n🎉 선택지 ID 동기화 완료');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncChoiceIds();
