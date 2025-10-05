const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetUserToTutorial() {
  try {
    console.log('🔧 모든 사용자를 튜토리얼로 초기화 중...');
    
    // 모든 사용자의 스토리 진행 상황을 튜토리얼로 초기화
    const users = await prisma.user.findMany({
      select: { id: true, username: true }
    });
    
    for (const user of users) {
      // 기존 진행 상황 업데이트 또는 생성
      const existingProgress = await prisma.storyProgress.findFirst({
        where: { user_id: user.id }
      });
      
      if (existingProgress) {
        // 기존 진행 상황을 튜토리얼로 초기화
        await prisma.storyProgress.update({
          where: { id: existingProgress.id },
          data: {
            current_chapter: 1,
            last_node_id: 200, // 튜토리얼 시작
            investigation_count: 3, // 조사 기회 3회
            checkpoint_count: 0,
            story_type: 'main',
            temp_data: null
          }
        });
        console.log(`✅ 사용자 ${user.username} (ID: ${user.id}) 진행 상황 초기화`);
      } else {
        // 새로운 진행 상황 생성
        await prisma.storyProgress.create({
          data: {
            user_id: user.id,
            current_chapter: 1,
            last_node_id: 200, // 튜토리얼 시작
            investigation_count: 3, // 조사 기회 3회
            checkpoint_count: 0,
            story_type: 'main',
            temp_data: null
          }
        });
        console.log(`✅ 사용자 ${user.username} (ID: ${user.id}) 새 진행 상황 생성`);
      }
      
      // 사용자 기본 정보도 초기화
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hp: 100,
          energy: 100,
          gold: 0,
          current_day: 1
        }
      });
      console.log(`  - HP, Energy, Gold 초기화`);
    }
    
    console.log('\n🎉 모든 사용자 튜토리얼 초기화 완료!');
    console.log('📊 초기화 내용:');
    console.log('  - 시작 노드: 200번 (튜토리얼)');
    console.log('  - 조사 기회: 3회');
    console.log('  - HP: 100, Energy: 100, Gold: 0');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserToTutorial();
