const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeChoicePrefix() {
  try {
    console.log('데이터베이스 연결 중...');

    // 1. choices 테이블에서 - 로 시작하는 choice_text 찾기
    const choices = await prisma.choice.findMany({
      where: {
        choice_text: {
          startsWith: '- '
        }
      }
    });

    console.log(`\n[choices 테이블] "- "로 시작하는 선택지 ${choices.length}개 발견`);

    // 2. choices 테이블 업데이트
    let choicesUpdated = 0;
    for (const choice of choices) {
      const cleanedText = choice.choice_text.replace(/^-\s+/, '');
      await prisma.choice.update({
        where: { id: choice.id },
        data: { choice_text: cleanedText }
      });
      console.log(`✓ Choice ID ${choice.id}: "${choice.choice_text}" → "${cleanedText}"`);
      choicesUpdated++;
    }

    // 3. story_choices 테이블에서 - 로 시작하는 choice_text 찾기
    const storyChoices = await prisma.storyChoice.findMany({
      where: {
        choice_text: {
          startsWith: '- '
        }
      }
    });

    console.log(`\n[story_choices 테이블] "- "로 시작하는 선택지 ${storyChoices.length}개 발견`);

    // 4. story_choices 테이블 업데이트
    let storyChoicesUpdated = 0;
    for (const choice of storyChoices) {
      const cleanedText = choice.choice_text.replace(/^-\s+/, '');
      await prisma.storyChoice.update({
        where: { id: choice.id },
        data: { choice_text: cleanedText }
      });
      console.log(`✓ StoryChoice ID ${choice.id}: "${choice.choice_text}" → "${cleanedText}"`);
      storyChoicesUpdated++;
    }

    console.log('\n=== 완료 ===');
    console.log(`총 ${choicesUpdated}개의 choices 업데이트됨`);
    console.log(`총 ${storyChoicesUpdated}개의 story_choices 업데이트됨`);

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeChoicePrefix();

