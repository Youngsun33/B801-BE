const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreChoiceTexts() {
  try {
    console.log('🔄 선택지 텍스트 원래대로 복구 중...');
    
    // 원래 선택지 텍스트들로 복구
    const choiceUpdates = [
      // 노드 1
      { id: 1296, text: "핵 전쟁에 대해 더 자세히 알고 싶습니다." },
      { id: 1297, text: "이미 알고 있는 이야기니 빠르게 갑시다." },
      
      // 노드 2
      { id: 1298, text: "빠르게 요약 좀 해 주시겠어요?" },
      { id: 1299, text: "이미 알고 있는 이야기니 빠르게 갑시다." },
      
      // 노드 3
      { id: 1300, text: "지금 나는 어떤 상태죠?" },
      
      // 노드 4
      { id: 1301, text: "그렇군요. 이제 출발하죠." },
      
      // 노드 5
      { id: 1302, text: "정말 출발합시다." },
      
      // 노드 300
      { id: 1306, text: "왼쪽 길" },
      { id: 1307, text: "가운데 길" },
      { id: 1308, text: "오른쪽 길" }
    ];
    
    for (const update of choiceUpdates) {
      await prisma.storyChoice.update({
        where: { id: update.id },
        data: { choice_text: update.text }
      });
      console.log(`  선택지 ${update.id}: "${update.text}"로 복구`);
    }
    
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
    
    console.log('\n✅ 선택지 텍스트 복구 완료');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreChoiceTexts();
