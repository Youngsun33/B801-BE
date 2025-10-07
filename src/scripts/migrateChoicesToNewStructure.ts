import { prisma } from '../lib/prisma';

async function migrateChoicesToNewStructure() {
  console.log('🔄 기존 choices 데이터를 새로운 구조로 마이그레이션 시작...');

  try {
    // 모든 MainStory 노드 가져오기
    const mainStories = await prisma.mainStory.findMany({
      orderBy: { node_id: 'asc' }
    });

    console.log(`📊 총 ${mainStories.length}개의 스토리 노드를 처리합니다.`);

    for (const story of mainStories) {
      console.log(`\n🔍 노드 ${story.node_id} (${story.title}) 처리 중...`);

      try {
        // 기존 choices JSON 파싱
        const choices = JSON.parse(story.choices || '[]');
        
        if (!Array.isArray(choices) || choices.length === 0) {
          console.log(`  ⚠️ 선택지가 없거나 빈 배열입니다.`);
          continue;
        }

        console.log(`  📝 ${choices.length}개의 선택지를 처리합니다.`);

        // 기존 StoryChoice 삭제 (중복 방지)
        await prisma.storyChoice.deleteMany({
          where: { story_node_id: story.node_id }
        });

        // 새로운 StoryChoice 생성
        for (let i = 0; i < choices.length; i++) {
          const choice = choices[i];
          
          let choiceText = '';
          let targetNodeId: number | null = null;

          if (typeof choice === 'string') {
            choiceText = choice;
          } else if (choice && typeof choice === 'object') {
            choiceText = choice.label || choice.text || `선택지 ${i + 1}`;
            targetNodeId = choice.targetNodeId || choice.target_node_id || null;
          }

          if (!choiceText.trim()) {
            console.log(`    ⚠️ 선택지 ${i + 1}의 텍스트가 비어있습니다.`);
            continue;
          }

          const storyChoice = await prisma.storyChoice.create({
            data: {
              story_node_id: story.node_id,
              choice_text: choiceText,
              target_node_id: targetNodeId,
              order_index: i,
              is_available: true
            }
          });

          console.log(`    ✅ 선택지 ${i + 1}: "${choiceText}" -> 노드 ${targetNodeId || '없음'}`);

          // 요구사항이 있는 경우 ChoiceRequirement 생성
          if (choice && typeof choice === 'object' && choice.requirements) {
            console.log(`    🔍 요구사항 처리:`, choice.requirements);
            
            // requirements가 객체인 경우
            if (typeof choice.requirements === 'object' && !Array.isArray(choice.requirements)) {
              for (const [reqType, reqValue] of Object.entries(choice.requirements)) {
                if (reqValue && typeof reqValue === 'number' && reqValue > 0) {
                  await prisma.choiceRequirement.create({
                    data: {
                      choice_id: storyChoice.id,
                      requirement_type: reqType,
                      requirement_value: reqValue,
                      operator: '>=',
                      description: `${reqType} ${reqValue} 이상 필요`
                    }
                  });
                  console.log(`      📋 요구사항: ${reqType} >= ${reqValue}`);
                }
              }
            }
          }
        }

      } catch (error) {
        console.error(`  ❌ 노드 ${story.node_id} 처리 중 오류:`, error);
        continue;
      }
    }

    console.log('\n✅ 마이그레이션 완료!');
    
    // 결과 확인
    const totalChoices = await prisma.storyChoice.count();
    const totalRequirements = await prisma.choiceRequirement.count();
    
    console.log(`📊 마이그레이션 결과:`);
    console.log(`  - 총 선택지: ${totalChoices}개`);
    console.log(`  - 총 요구사항: ${totalRequirements}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateChoicesToNewStructure();
}

export default migrateChoicesToNewStructure;
