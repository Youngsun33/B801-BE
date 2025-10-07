const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkChoicePatterns() {
  try {
    console.log('데이터베이스 연결 중...\n');

    // 1. choices 테이블의 샘플 데이터 확인
    const choices = await prisma.choice.findMany({
      take: 20,
      orderBy: { id: 'asc' }
    });

    console.log(`=== choices 테이블 샘플 (총 ${choices.length}개) ===`);
    choices.forEach(choice => {
      console.log(`ID ${choice.id}: "${choice.choice_text}"`);
    });

    // 2. story_choices 테이블의 샘플 데이터 확인
    const storyChoices = await prisma.storyChoice.findMany({
      take: 20,
      orderBy: { id: 'asc' }
    });

    console.log(`\n=== story_choices 테이블 샘플 (총 ${storyChoices.length}개) ===`);
    storyChoices.forEach(choice => {
      console.log(`ID ${choice.id}: "${choice.choice_text}"`);
    });

    // 3. [ 로 시작하는 모든 패턴 찾기
    const choicesWithBracket = await prisma.choice.findMany({
      where: {
        choice_text: {
          startsWith: '['
        }
      }
    });

    console.log(`\n=== choices 테이블에서 [ 로 시작하는 선택지 (${choicesWithBracket.length}개) ===`);
    choicesWithBracket.forEach(choice => {
      console.log(`ID ${choice.id}: "${choice.choice_text}"`);
    });

    const storyChoicesWithBracket = await prisma.storyChoice.findMany({
      where: {
        choice_text: {
          startsWith: '['
        }
      }
    });

    console.log(`\n=== story_choices 테이블에서 [ 로 시작하는 선택지 (${storyChoicesWithBracket.length}개) ===`);
    storyChoicesWithBracket.forEach(choice => {
      console.log(`ID ${choice.id}: "${choice.choice_text}"`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChoicePatterns();

