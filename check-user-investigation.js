const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserInvestigation() {
  try {
    console.log('🔍 사용자 조사 기회 확인 중...');
    
    // 모든 사용자의 조사 기회 확인
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        current_day: true
      }
    });
    
    console.log('\n📋 사용자 목록:');
    for (const user of users) {
      console.log(`- 사용자 ID: ${user.id}, 이름: ${user.username}, 현재 일차: ${user.current_day}`);
      
      // 각 사용자의 스토리 진행 상황 확인
      const progress = await prisma.storyProgress.findFirst({
        where: { user_id: user.id }
      });
      
      if (progress) {
        console.log(`  조사 기회: ${progress.investigation_count}회`);
        console.log(`  현재 노드: ${progress.last_node_id}`);
        console.log(`  마지막 저장: ${progress.last_saved_at}`);
      } else {
        console.log('  스토리 진행 상황: 없음');
      }
    }
    
    // 조사 기회가 0인 사용자들 수정
    console.log('\n🔧 조사 기회 부족한 사용자들 수정 중...');
    
    for (const user of users) {
      const progress = await prisma.storyProgress.findFirst({
        where: { user_id: user.id }
      });
      
      if (progress && progress.investigation_count <= 0) {
        await prisma.storyProgress.update({
          where: { id: progress.id },
          data: { investigation_count: 3 } // 조사 기회 3회로 초기화
        });
        console.log(`✅ 사용자 ${user.username}의 조사 기회를 3회로 초기화`);
      }
    }
    
    // 조사 기회가 없는 사용자들을 위해 새로 생성
    for (const user of users) {
      const progress = await prisma.storyProgress.findFirst({
        where: { user_id: user.id }
      });
      
      if (!progress) {
        await prisma.storyProgress.create({
          data: {
            user_id: user.id,
            current_chapter: 1,
            last_node_id: 200, // 튜토리얼부터 시작
            investigation_count: 3, // 조사 기회 3회
            checkpoint_count: 0,
            story_type: 'main',
            temp_data: null
          }
        });
        console.log(`✅ 사용자 ${user.username}의 스토리 진행 상황 생성 (조사 기회 3회)`);
      }
    }
    
    console.log('\n🎉 조사 기회 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserInvestigation();
