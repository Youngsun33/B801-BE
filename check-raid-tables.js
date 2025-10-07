const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 모든 테이블 목록 조회
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📋 현재 데이터베이스의 테이블들:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    // 레이드 조사 관련 테이블 확인
    const raidTables = ['raid_search_areas', 'raid_search_area_items', 'user_raid_items', 'daily_raid_search_count'];
    
    console.log('\n🔍 레이드 조사 관련 테이블 확인:');
    for (const tableName of raidTables) {
      const tableExists = result.rows.some(row => row.table_name === tableName);
      console.log(`${tableExists ? '✅' : '❌'} ${tableName}: ${tableExists ? '존재함' : '존재하지 않음'}`);
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
