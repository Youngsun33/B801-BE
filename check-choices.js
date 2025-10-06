const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkChoices() {
  try {
    console.log('🔍 선택지 데이터 확인');
    
    // 노드 300의 선택지들 확인
    const choices = await prisma.storyChoice.findMany({
      where: { story_node_id: 300 },
      select: {
        id: true,
        story_node_id: true,
        choice_text: true,
        target_node_id: true,
        order_index: true,
        is_available: true
      }
    });
    
    console.table(choices);
    
    console.log('\n🔍 노드 300 정보');
    const node300 = await prisma.mainStory.findUnique({
      where: { node_id: 300 },
      select: {
        node_id: true,
        title: true,
        choices: true
      }
    });
    
    console.log(node300);
    
    // 다른 노드들의 선택지도 확인
    console.log('\n🔍 다른 노드들의 선택지 확인');
    const otherChoices = await prisma.storyChoice.findMany({
      where: {
        story_node_id: {
          in: [1, 2, 3, 4, 5]
        }
      },
      select: {
        id: true,
        story_node_id: true,
        choice_text: true,
        target_node_id: true,
        is_available: true
      },
      orderBy: [
        { story_node_id: 'asc' },
        { order_index: 'asc' }
      ]
    });
    
    console.table(otherChoices);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChoices();
