const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserProgress() {
  try {
    console.log('🔧 사용자 진행 상황 수정 중...');
    
    // testuser의 진행 상황 확인
    const user = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });
    
    if (!user) {
      console.log('❌ testuser 없음');
      return;
    }
    
    console.log(`✅ testuser 발견 (ID: ${user.id})`);
    
    // 진행 상황 확인
    const progress = await prisma.storyProgress.findFirst({
      where: { user_id: user.id }
    });
    
    if (progress) {
      console.log('\n📋 현재 진행 상황:');
      console.log(`  - last_node_id: ${progress.last_node_id}`);
      console.log(`  - investigation_count: ${progress.investigation_count}`);
      console.log(`  - current_chapter: ${progress.current_chapter}`);
      
      // 진행 상황을 튜토리얼로 초기화
      await prisma.storyProgress.update({
        where: { id: progress.id },
        data: {
          current_chapter: 1,
          last_node_id: 200, // 튜토리얼 시작
          investigation_count: 3, // 조사 기회 3회
          checkpoint_count: 0,
          story_type: 'main',
          temp_data: null
        }
      });
      
      console.log('\n✅ 진행 상황을 튜토리얼로 초기화 완료:');
      console.log('  - last_node_id: 200');
      console.log('  - investigation_count: 3');
      
    } else {
      console.log('❌ 진행 상황 없음');
      
      // 새로 생성
      await prisma.storyProgress.create({
        data: {
          user_id: user.id,
          current_chapter: 1,
          last_node_id: 200,
          investigation_count: 3,
          checkpoint_count: 0,
          story_type: 'main',
          temp_data: null
        }
      });
      
      console.log('✅ 새 진행 상황 생성 완료');
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
    
    console.log('\n🎉 testuser 완전 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserProgress();
