const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTutorialNodes() {
  try {
    console.log('🔍 튜토리얼 노드들 확인 중...');
    
    // 튜토리얼 노드들 확인
    const tutorialNodes = [200, 209, 210];
    
    console.log('\n📋 튜토리얼 노드들 (DB에서):');
    for (const nodeId of tutorialNodes) {
      const dbNode = await prisma.mainStory.findUnique({
        where: { node_id: nodeId }
      });
      
      if (dbNode) {
        console.log(`✅ 노드 ${nodeId}: ${dbNode.title} (${dbNode.node_type})`);
      } else {
        console.log(`❌ 노드 ${nodeId}: DB에 없음`);
      }
    }
    
    // STORY_NODES에서도 확인
    const { STORY_NODES } = require('./src/lib/storyNodes');
    
    console.log('\n📋 튜토리얼 노드들 (STORY_NODES에서):');
    for (const nodeId of tutorialNodes) {
      const storyNode = STORY_NODES[nodeId];
      if (storyNode) {
        console.log(`✅ 노드 ${nodeId}: ${storyNode.text.substring(0, 50)}... (${storyNode.nodeType})`);
      } else {
        console.log(`❌ 노드 ${nodeId}: STORY_NODES에 없음`);
      }
    }
    
    // 게임 시작 노드 확인
    console.log('\n🎮 현재 게임 시작 설정:');
    const firstNode = await prisma.mainStory.findFirst({
      orderBy: { node_id: 'asc' }
    });
    
    console.log(`현재 시작 노드: ${firstNode ? firstNode.node_id : '없음'}`);
    console.log(`시작 노드 제목: ${firstNode ? firstNode.title : '없음'}`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTutorialNodes();
