const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkExistingData() {
  try {
    console.log('🔍 기존 데이터 확인 중...');
    await client.connect();
    
    // 기존 사용자 데이터 확인 (users)
    const userResult = await client.query('SELECT COUNT(*) as count FROM "users"');
    console.log('👥 기존 사용자 수:', userResult.rows[0].count);
    
    // 기존 테이블들 확인
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 기존 테이블들:');
    tablesResult.rows.forEach(row => {
      console.log('- ' + row.table_name);
    });
    
    // 레이드 조사 테이블이 이미 있는지 확인
    const raidTables = tablesResult.rows.filter(row => 
      row.table_name.includes('raid') || 
      row.table_name.includes('search') ||
      row.table_name.includes('area')
    );
    
    if (raidTables.length > 0) {
      console.log('⚠️  레이드 조사 관련 테이블이 이미 존재합니다:');
      raidTables.forEach(row => {
        console.log('- ' + row.table_name);
      });
    } else {
      console.log('✅ 레이드 조사 테이블이 없습니다. 안전하게 추가할 수 있습니다.');
    }
    
    // 기존 사용자 몇 명 확인
    if (userResult.rows[0].count > 0) {
      const sampleUsers = await client.query('SELECT id, username, hp, energy, gold, is_alive FROM "users" LIMIT 3');
      console.log('📋 기존 사용자 샘플:');
      sampleUsers.rows.forEach(user => {
        console.log(`- ID: ${user.id}, 사용자명: ${user.username}, HP: ${user.hp}, 에너지: ${user.energy}, 골드: ${user.gold}, 활성: ${user.is_alive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

checkExistingData();
