const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTutorialFlow() {
  try {
    console.log('🔍 튜토리얼 플로우 확인 중...');
    
    // 노드 664 확인
    const tutorialNode = await prisma.mainStory.findUnique({
      where: { node_id: 664 }
    });
    
    if (!tutorialNode) {
      console.log('❌ 노드 664가 없습니다.');
      return;
    }
    
    console.log('✅ 노드 664 (튜토리얼) 정보:');
    console.log(`  - 제목: ${tutorialNode.title}`);
    console.log(`  - 텍스트: ${tutorialNode.text.substring(0, 100)}...`);
    console.log(`  - choices JSON: ${tutorialNode.choices}`);
    
    // StoryChoice 테이블에서 선택지 확인
    const storyChoices = await prisma.storyChoice.findMany({
      where: { story_node_id: 664 },
      orderBy: { order_index: 'asc' }
    });
    
    console.log(`\n📋 노드 664의 선택지들 (${storyChoices.length}개):`);
    for (const choice of storyChoices) {
      console.log(`  - "${choice.choice_text}" → 노드 ${choice.target_node_id}`);
      
      // 다음 노드 확인
      if (choice.target_node_id) {
        const nextNode = await prisma.mainStory.findUnique({
          where: { node_id: choice.target_node_id }
        });
        if (nextNode) {
          console.log(`    → 다음 노드: ${nextNode.title}`);
        } else {
          console.log(`    → ❌ 다음 노드 ${choice.target_node_id} 없음!`);
        }
      }
    }
    
    // 게임 시작 노드 설정 확인
    console.log('\n🎮 게임 시작 설정:');
    const startNode = await prisma.mainStory.findUnique({
      where: { node_id: 664 }
    });
    console.log(`  - 현재 시작 노드: 664번`);
    
    // 사용자 진행상황 확인
    const users = await prisma.user.findMany({
      include: {
        story_progress: true
      }
    });
    
    console.log('\n👥 사용자 진행상황:');
    for (const user of users) {
      const progress = user.story_progress[0];
      console.log(`  - ${user.username}: 현재 노드 ${progress?.last_node_id || '없음'}`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTutorialFlow();
