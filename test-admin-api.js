const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function testAdminAPI() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. 유저 목록 조회 테스트
    console.log('\n📋 유저 목록 조회 테스트:');
    const usersResult = await client.query(`
      SELECT id, username FROM users ORDER BY id LIMIT 5
    `);
    console.log('유저 목록:', usersResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('❌ 유저가 없습니다!');
      return;
    }

    const testUserId = usersResult.rows[0].id;
    console.log(`\n🧪 테스트 유저 ID: ${testUserId}`);

    // 2. 특정 유저의 레이드 아이템 조회 테스트
    console.log('\n📦 유저 레이드 아이템 조회 테스트:');
    const userItemsResult = await client.query(`
      SELECT item_name, quantity, obtained_at
      FROM user_raid_items
      WHERE user_id = $1 AND quantity > 0
      ORDER BY item_name
    `, [testUserId]);
    console.log('유저 아이템:', userItemsResult.rows);

    // 3. 테스트용 아이템 추가
    console.log('\n➕ 테스트 아이템 추가:');
    await client.query(`
      INSERT INTO user_raid_items (user_id, item_name, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_name)
      DO UPDATE SET quantity = user_raid_items.quantity + $3
    `, [testUserId, '테스트 아이템', 5]);
    console.log('✅ 테스트 아이템 추가 완료');

    // 4. 다시 조회해서 확인
    console.log('\n🔍 추가 후 아이템 조회:');
    const updatedItemsResult = await client.query(`
      SELECT item_name, quantity, obtained_at
      FROM user_raid_items
      WHERE user_id = $1 AND quantity > 0
      ORDER BY item_name
    `, [testUserId]);
    console.log('업데이트된 아이템:', updatedItemsResult.rows);

    // 5. 전체 유저 아이템 조회 (관리자용)
    console.log('\n👑 전체 유저 아이템 조회 (관리자용):');
    const allUserItemsResult = await client.query(`
      SELECT 
        u.username,
        uri.item_name,
        uri.quantity,
        uri.obtained_at
      FROM user_raid_items uri
      JOIN users u ON uri.user_id = u.id
      WHERE uri.quantity > 0
      ORDER BY u.username, uri.item_name
    `);
    console.log('전체 유저 아이템:', allUserItemsResult.rows);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

testAdminAPI();

