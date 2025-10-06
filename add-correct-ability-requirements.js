const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCorrectAbilityRequirements() {
  try {
    console.log('🔧 올바른 능력 요구사항 추가 중...');
    
    // 기존 요구사항 삭제
    await prisma.choiceRequirement.deleteMany({});
    
    console.log('✅ 기존 요구사항 삭제 완료');
    
    // 능력 요구사항이 있는 선택지들 찾기
    const choicesWithRequirements = [
      // 노드 3의 [매력] 선택지
      {
        choice_text: "[매력] 그냥 알려주시면 안 돼요?",
        story_node_id: 3,
        requirement: { type: 'ability', name: '매력', level: 1 }
      },
      // 노드 9의 [매력/언변술] 선택지
      {
        choice_text: "[매력/언변술] 무슨 일 있으세요?",
        story_node_id: 9,
        requirement: { type: 'ability', name: '매력', level: 1 }
      }
    ];
    
    let requirementIdCounter = 1;
    
    for (const choiceData of choicesWithRequirements) {
      // 해당 선택지 찾기
      const choice = await prisma.storyChoice.findFirst({
        where: {
          story_node_id: choiceData.story_node_id,
          choice_text: choiceData.choice_text
        }
      });
      
      if (choice) {
        // 요구사항 생성
        await prisma.choiceRequirement.create({
          data: {
            id: requirementIdCounter++,
            choice_id: choice.id,
            requirement_type: choiceData.requirement.type,
            requirement_value: choiceData.requirement.level,
            operator: '>=',
            description: `${choiceData.requirement.name} 레벨 ${choiceData.requirement.level} 이상 필요`
          }
        });
        
        console.log(`✅ ${choiceData.choice_text}에 ${choiceData.requirement.name} 요구사항 추가`);
      }
    }
    
    console.log(`\n🎉 올바른 능력 요구사항 추가 완료!`);
    console.log(`  - 추가된 요구사항: ${requirementIdCounter - 1}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCorrectAbilityRequirements();
