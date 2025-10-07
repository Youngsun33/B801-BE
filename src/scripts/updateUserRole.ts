import { prisma } from '../lib/prisma';

async function updateUserRole() {
  try {
    // administrator 계정의 role을 admin으로 업데이트
    const updatedUser = await prisma.user.update({
      where: { username: 'administrator' },
      data: { role: 'admin' },
      select: { id: true, username: true, role: true }
    });

    console.log('✅ 사용자 역할이 업데이트되었습니다:');
    console.log('사용자명:', updatedUser.username);
    console.log('역할:', updatedUser.role);
    console.log('ID:', updatedUser.id);

    // 모든 사용자 목록 확인
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, role: true }
    });
    
    console.log('\n📋 전체 사용자 목록:');
    allUsers.forEach((user: any) => {
      console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    });

  } catch (error) {
    console.error('❌ 역할 업데이트 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();
