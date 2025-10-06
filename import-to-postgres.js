const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('📥 PostgreSQL 데이터 가져오기 시작...');
    
    // 가장 최근 export 파일 찾기
    const files = fs.readdirSync('.').filter(f => f.startsWith('sqlite-export-') && f.endsWith('.json'));
    if (files.length === 0) {
      throw new Error('Export 파일을 찾을 수 없습니다.');
    }
    
    const latestFile = files.sort().pop();
    console.log(`📄 파일 로드: ${latestFile}`);
    
    const exportData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    // 데이터 가져오기 순서 (외래키 제약조건 고려)
    const importOrder = [
      'resources',
      'abilities', 
      'storyAbilities',
      'storyItems',
      'items',
      'bosses',
      'stories',
      'users',
      'nodes',
      'mainStories',
      'randomStories',
      'choices',
      'storyChoices',
      'choiceConstraints',
      'choiceRequirements',
      'choiceResults',
      'checkpoints',
      'raidTeams',
      'teamMembers',
      'raidItems',
      'inventory',
      'userResources',
      'userAbilities',
      'userStoryAbilities',
      'userStoryItems',
      'userCheckpoints',
      'userSaveStates',
      'investigationSessions',
      'dailyInvestigationCount',
      'storyProgress'
    ];

    for (const tableName of importOrder) {
      const data = exportData[tableName];
      if (data && data.length > 0) {
        console.log(`📥 ${tableName} 가져오는 중... (${data.length}개 레코드)`);
        
        try {
          // Prisma 모델명으로 변환 (camelCase → PascalCase)
          const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
          
          // 각 레코드를 개별적으로 삽입 (중복 처리)
          for (const record of data) {
            try {
              await prisma[tableName].create({
                data: record
              });
            } catch (error) {
              if (error.code === 'P2002') {
                console.log(`  ⚠️  ${tableName}: 중복 레코드 건너뛰기`);
              } else {
                console.error(`  ❌ ${tableName} 레코드 삽입 실패:`, error.message);
              }
            }
          }
          
          console.log(`  ✅ ${tableName} 가져오기 완료`);
        } catch (error) {
          console.error(`  ❌ ${tableName} 가져오기 실패:`, error.message);
        }
      }
    }
    
    console.log('🎉 모든 데이터 가져오기 완료!');
    
  } catch (error) {
    console.error('❌ 데이터 가져오기 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
