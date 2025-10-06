const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importToAzure() {
  try {
    console.log('📥 Azure PostgreSQL에 데이터 가져오기 시작...');
    
    // SQLite export 파일 읽기
    const exportFile = 'sqlite-export-2025-10-06.json';
    if (!fs.existsSync(exportFile)) {
      throw new Error('Export 파일을 찾을 수 없습니다.');
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    console.log(`📄 파일 로드: ${exportFile}`);
    
    // 순서대로 테이블 가져오기 (외래키 제약조건 고려)
    const importOrder = [
      { table: 'resource', data: exportData.resources },
      { table: 'ability', data: exportData.abilities },
      { table: 'item', data: exportData.items },
      { table: 'boss', data: exportData.bosses },
      { table: 'story', data: exportData.stories },
      { table: 'user', data: exportData.users },
      { table: 'node', data: exportData.nodes },
      { table: 'choice', data: exportData.choices },
      { table: 'choiceConstraint', data: exportData.choiceConstraints },
      { table: 'choiceResult', data: exportData.choiceResults },
      { table: 'checkpoint', data: exportData.checkpoints },
      { table: 'userResource', data: exportData.userResources },
      { table: 'userAbility', data: exportData.userAbilities },
      { table: 'userCheckpoint', data: exportData.userCheckpoints },
      { table: 'investigationSession', data: exportData.investigationSessions },
      { table: 'dailyInvestigationCount', data: exportData.dailyInvestigationCount }
    ];

    for (const { table, data } of importOrder) {
      if (data && data.length > 0) {
        console.log(`\n📥 ${table} 가져오는 중... (${data.length}개 레코드)`);
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const record of data) {
          try {
            // id 필드 제거 (자동 생성)
            const { id, ...recordWithoutId } = record;
            
            await prisma[table].create({
              data: recordWithoutId
            });
            successCount++;
          } catch (error) {
            if (error.code === 'P2002') {
              // 중복 데이터 - 건너뛰기
              skipCount++;
            } else {
              console.log(`    ❌ 레코드 삽입 실패: ${error.message}`);
            }
          }
        }
        
        console.log(`    ✅ 성공: ${successCount}개, 건너뛴 중복: ${skipCount}개`);
      } else {
        console.log(`\n⚠️  ${table}: 데이터 없음`);
      }
    }
    
    console.log('\n🎉 Azure PostgreSQL 데이터 가져오기 완료!');
    
    // 최종 데이터 확인
    console.log('\n📊 최종 데이터 확인:');
    const userCount = await prisma.user.count();
    const nodeCount = await prisma.node.count();
    const sessionCount = await prisma.investigationSession.count();
    
    console.log(`  - 사용자: ${userCount}명`);
    console.log(`  - 스토리 노드: ${nodeCount}개`);
    console.log(`  - 조사 세션: ${sessionCount}개`);
    
  } catch (error) {
    console.error('❌ 데이터 가져오기 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importToAzure();
