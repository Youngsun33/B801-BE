const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function testConnection() {
  try {
    console.log('🔍 PostgreSQL 데이터베이스 연결 테스트...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 사용자 테이블 확인
    const result = await client.query('SELECT COUNT(*) as user_count FROM "User"');
    console.log('👥 사용자 수:', result.rows[0].user_count);
    
    if (result.rows[0].user_count > 0) {
      const users = await client.query('SELECT id, username, hp, energy, gold, is_alive FROM "User" LIMIT 5');
      console.log('📋 사용자 목록:');
      users.rows.forEach(user => {
        console.log(`- ID: ${user.id}, 사용자명: ${user.username}, HP: ${user.hp}, 에너지: ${user.energy}, 골드: ${user.gold}, 활성: ${user.is_alive}`);
      });
    } else {
      console.log('❌ 사용자가 없습니다!');
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 오류:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
