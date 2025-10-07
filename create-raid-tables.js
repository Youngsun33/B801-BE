const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function createTables() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // user_raid_items 테이블 생성
    console.log('\n📦 user_raid_items 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_raid_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_name)
      )
    `);
    console.log('✅ user_raid_items 테이블 생성 완료');

    // daily_raid_search_count 테이블 생성
    console.log('\n📊 daily_raid_search_count 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_raid_search_count (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(user_id, day)
      )
    `);
    console.log('✅ daily_raid_search_count 테이블 생성 완료');

    // 인덱스 생성
    console.log('\n🔍 인덱스 생성 중...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_raid_items_user_id ON user_raid_items(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_raid_search_count_user_day ON daily_raid_search_count(user_id, day)
    `);
    console.log('✅ 인덱스 생성 완료');

    console.log('\n🎉 모든 레이드 조사 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
