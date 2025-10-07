const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkRaidSearchData() {
  try {
    console.log('🔍 레이드 조사 데이터 확인 중...');
    await client.connect();
    
    // 1. 레이드 조사 지역 확인
    console.log('\n📋 레이드 조사 지역 목록:');
    const areas = await client.query('SELECT * FROM raid_search_areas ORDER BY id');
    areas.rows.forEach(area => {
      console.log(`- ID: ${area.id}, 이름: ${area.name}, 설명: ${area.description}`);
    });
    
    // 2. 각 지역별 아이템 개수 확인
    console.log('\n📦 각 지역별 아이템 개수:');
    for (const area of areas.rows) {
      const itemCount = await client.query(
        'SELECT COUNT(*) as count FROM raid_search_area_items WHERE area_id = $1',
        [area.id]
      );
      console.log(`- ${area.name}: ${itemCount.rows[0].count}개 아이템`);
    }
    
    // 3. 각 지역별 아이템 상세 목록
    console.log('\n📝 각 지역별 아이템 상세 목록:');
    for (const area of areas.rows) {
      console.log(`\n🏞️  ${area.name}:`);
      const items = await client.query(`
        SELECT item_name, drop_rate, COUNT(*) as count 
        FROM raid_search_area_items 
        WHERE area_id = $1 
        GROUP BY item_name, drop_rate 
        ORDER BY item_name
      `, [area.id]);
      
      items.rows.forEach(item => {
        console.log(`  - ${item.item_name}: ${item.count}개 (드롭률: ${item.drop_rate}%)`);
      });
    }
    
    // 4. 총 아이템 개수 확인
    const totalItems = await client.query('SELECT COUNT(*) as count FROM raid_search_area_items');
    console.log(`\n📊 총 아이템 개수: ${totalItems.rows[0].count}개`);
    
    console.log('\n✅ 레이드 조사 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

checkRaidSearchData();
