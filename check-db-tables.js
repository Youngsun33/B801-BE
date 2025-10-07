const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('데이터베이스에 연결되었습니다.');

    // 모든 테이블 조회
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('현재 데이터베이스의 테이블들:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
    console.log('데이터베이스 연결이 종료되었습니다.');
  }
}

checkTables();
