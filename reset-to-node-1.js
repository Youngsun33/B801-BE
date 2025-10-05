const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetToNode1() {
  try {
    console.log('🔧 모든 사용자를 노드 1번으로 초기화 중...');
    
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // 기존 진행상황 삭제
      await prisma.storyProgress.deleteMany({
        where: { user_id: user.id }
      });
      
      // 새로 생성
      await prisma.storyProgress.create({
        data: {
          user_id: user.id,
          current_chapter: 1,
          last_node_id: 1, // 노드 1번으로 변경
          investigation_count: 3,
          checkpoint_count: 0,
          story_type: 'main',
          temp_data: null,
        },
      });
      
      console.log(`✅ 사용자 ${user.username} (ID: ${user.id}) → 노드 1번으로 초기화`);
    }
    
    console.log('\n🎉 모든 사용자 노드 1번 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetToNode1();
