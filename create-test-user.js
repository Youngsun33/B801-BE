const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 테스트 사용자 생성 중...');
    
    // 기존 testuser 삭제 (있다면)
    try {
      await prisma.user.delete({
        where: { username: 'testuser' }
      });
      console.log('✅ 기존 testuser 삭제');
    } catch (error) {
      console.log('⚠️ 기존 testuser 없음');
    }
    
    // 새 testuser 생성
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        hp: 100,
        energy: 100,
        gold: 0,
        attack_power: 10,
        current_day: 1,
        is_alive: true,
        role: 'user'
      }
    });
    
    console.log('✅ testuser 생성 완료:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - 사용자명: ${user.username}`);
    console.log(`  - 비밀번호: password123`);
    
    // 스토리 진행 상황 생성
    await prisma.storyProgress.create({
      data: {
        user_id: user.id,
        current_chapter: 1,
        last_node_id: 200, // 튜토리얼 시작
        investigation_count: 3,
        checkpoint_count: 0,
        story_type: 'main',
        temp_data: null
      }
    });
    
    console.log('✅ testuser 스토리 진행 상황 생성');
    
    console.log('\n🎉 테스트 사용자 준비 완료!');
    console.log('📋 로그인 정보:');
    console.log('  - 사용자명: testuser');
    console.log('  - 비밀번호: password123');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
