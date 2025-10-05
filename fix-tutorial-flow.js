const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTutorialFlow() {
  try {
    console.log('🔧 튜토리얼 플로우 수정 중...');
    
    // 1. 노드 664의 선택지를 올바르게 파싱하고 StoryChoice에 저장
    const tutorialNode = await prisma.mainStory.findUnique({
      where: { node_id: 664 }
    });
    
    if (!tutorialNode) {
      console.log('❌ 노드 664가 없습니다.');
      return;
    }
    
    console.log('📝 노드 664 선택지 수정 중...');
    
    // 기존 StoryChoice 삭제
    await prisma.storyChoice.deleteMany({
      where: { story_node_id: 664 }
    });
    
    // choices JSON 파싱
    let choicesArray = [];
    try {
      choicesArray = JSON.parse(tutorialNode.choices);
      console.log('✅ choices 파싱 성공:', choicesArray);
    } catch (error) {
      console.log('❌ choices 파싱 실패:', error.message);
      return;
    }
    
    // StoryChoice 테이블에 선택지들 추가
    for (let i = 0; i < choicesArray.length; i++) {
      const choice = choicesArray[i];
      if (choice && choice.targetNodeId) {
        await prisma.storyChoice.create({
          data: {
            story_node_id: 664,
            choice_text: choice.label,
            target_node_id: choice.targetNodeId,
            order_index: i,
            is_available: true
          }
        });
        console.log(`✅ 선택지 ${i + 1}: "${choice.label}" → 노드 ${choice.targetNodeId}`);
      }
    }
    
    // 2. 게임 시작 노드를 664로 변경
    console.log('\n🎮 게임 시작 노드를 664로 변경...');
    
    // 3. 모든 사용자를 노드 664로 초기화
    console.log('\n👥 모든 사용자를 노드 664로 초기화...');
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // 기존 진행상황 삭제
      await prisma.storyProgress.deleteMany({
        where: { user_id: user.id }
      });
      
      // 새로 생성
      await prisma.storyProgress.create({
        data: {
          user_id: user.id,
          current_chapter: 1,
          last_node_id: 664, // 노드 664로 시작
          investigation_count: 3,
          checkpoint_count: 0,
          story_type: 'main',
          temp_data: null,
        },
      });
      
      console.log(`✅ 사용자 ${user.username} → 노드 664로 초기화`);
    }
    
    console.log('\n🎉 튜토리얼 플로우 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTutorialFlow();
