const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAzureData() {
  try {
    console.log('🔍 Azure PostgreSQL 데이터베이스 데이터 확인 중...\n');
    
    // 각 테이블별 레코드 수 확인
    const tables = [
      'user', 'story', 'node', 'choice', 'resource', 'userResource',
      'choiceConstraint', 'choiceResult', 'checkpoint', 'userCheckpoint',
      'userSaveState', 'item', 'inventory', 'raidTeam', 'teamMember',
      'raidItem', 'boss', 'ability', 'userAbility', 'investigationSession',
      'dailyInvestigationCount', 'storyAbility', 'userStoryAbility',
      'storyItem', 'userStoryItem', 'randomStory', 'mainStory',
      'storyChoice', 'choiceRequirement', 'storyProgress'
    ];

    console.log('📊 테이블별 레코드 수:');
    console.log('=' .repeat(50));
    
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        if (count > 0) {
          console.log(`✅ ${table}: ${count}개 레코드`);
          totalRecords += count;
        } else {
          console.log(`❌ ${table}: 0개 레코드`);
        }
      } catch (error) {
        console.log(`⚠️  ${table}: 테이블 없음 또는 접근 불가`);
      }
    }
    
    console.log('=' .repeat(50));
    console.log(`📈 총 레코드 수: ${totalRecords}개`);
    
    // 사용자 데이터 샘플 확인
    console.log('\n👥 사용자 데이터 샘플:');
    const users = await prisma.user.findMany({ take: 3 });
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 사용자명: ${user.username}, HP: ${user.hp}, 골드: ${user.gold}`);
    });
    
    // 스토리 노드 샘플 확인
    console.log('\n📖 스토리 노드 샘플:');
    const nodes = await prisma.node.findMany({ take: 3 });
    nodes.forEach(node => {
      console.log(`  - ID: ${node.id}, 노드ID: ${node.node_id}, 제목: ${node.title || 'N/A'}`);
    });
    
    // 조사 세션 샘플 확인
    console.log('\n🎮 조사 세션 샘플:');
    const sessions = await prisma.investigationSession.findMany({ take: 3 });
    sessions.forEach(session => {
      console.log(`  - ID: ${session.id}, 사용자ID: ${session.user_id}, 일차: ${session.day}, 상태: ${session.status}`);
    });
    
    console.log('\n🎉 Azure PostgreSQL 데이터베이스 연결 및 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 데이터 확인 실패:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAzureData();
