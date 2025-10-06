const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChoiceTitles() {
  try {
    console.log('🔧 선택지 텍스트를 노드 타이틀과 일치시키는 중...');
    
    // 모든 StoryChoice 조회
    const allChoices = await prisma.storyChoice.findMany({
      orderBy: [
        { story_node_id: 'asc' },
        { order_index: 'asc' }
      ]
    });
    
    console.log(`총 ${allChoices.length}개 선택지 확인 중...`);
    
    let updatedCount = 0;
    
    for (const choice of allChoices) {
      // 타겟 노드 정보 조회
      const targetNode = await prisma.mainStory.findUnique({
        where: { node_id: choice.target_node_id },
        select: { title: true }
      });
      
      if (targetNode && choice.choice_text !== targetNode.title) {
        console.log(`\n선택지 수정: 노드 ${choice.story_node_id}`);
        console.log(`  기존: "${choice.choice_text}"`);
        console.log(`  변경: "${targetNode.title}"`);
        
        await prisma.storyChoice.update({
          where: { id: choice.id },
          data: { choice_text: targetNode.title }
        });
        
        updatedCount++;
      }
    }
    
    console.log(`\n🎉 ${updatedCount}개 선택지 텍스트 수정 완료`);
    
    // MainStory.choices JSON도 동기화
    console.log('\n🔄 MainStory.choices JSON 동기화 중...');
    
    const nodesWithChoices = await prisma.mainStory.findMany({
      where: {
        choices: {
          not: '[]'
        }
      }
    });
    
    for (const node of nodesWithChoices) {
      const storyChoices = await prisma.storyChoice.findMany({
        where: { story_node_id: node.node_id },
        orderBy: { order_index: 'asc' }
      });
      
      if (storyChoices.length > 0) {
        const updatedChoices = storyChoices.map(choice => ({
          id: choice.id,
          targetNodeId: choice.target_node_id,
          label: choice.choice_text
        }));
        
        await prisma.mainStory.update({
          where: { node_id: node.node_id },
          data: {
            choices: JSON.stringify(updatedChoices)
          }
        });
        
        console.log(`  노드 ${node.node_id}: ${storyChoices.length}개 선택지 JSON 동기화`);
      }
    }
    
    console.log('\n✅ 모든 작업 완료');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChoiceTitles();
