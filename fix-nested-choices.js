const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNestedChoices() {
  try {
    console.log('🔧 중첩된 choices 수정 중...');
    
    const tutorialNode = await prisma.mainStory.findUnique({
      where: { node_id: 664 }
    });
    
    if (!tutorialNode) {
      console.log('❌ 노드 664가 없습니다.');
      return;
    }
    
    console.log('📝 원본 choices:', tutorialNode.choices);
    
    // 중첩된 JSON 파싱
    let choicesArray = [];
    try {
      // 첫 번째 파싱
      const firstParse = JSON.parse(tutorialNode.choices);
      console.log('첫 번째 파싱 결과:', firstParse);
      
      // 두 번째 파싱 (첫 번째 요소가 문자열이므로)
      if (Array.isArray(firstParse) && firstParse.length > 0 && typeof firstParse[0] === 'string') {
        choicesArray = JSON.parse(firstParse[0]);
        console.log('두 번째 파싱 결과:', choicesArray);
      }
    } catch (error) {
      console.log('❌ choices 파싱 실패:', error.message);
      return;
    }
    
    // 기존 StoryChoice 삭제
    await prisma.storyChoice.deleteMany({
      where: { story_node_id: 664 }
    });
    
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
    
    console.log('\n🎉 중첩된 choices 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNestedChoices();
