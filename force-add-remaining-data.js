const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function forceAddRemainingData() {
  try {
    console.log('🔍 나머지 지역 데이터 강제 추가 중...');
    await client.connect();
    
    // 번화가 (area_id: 3)
    console.log('📝 번화가 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (3, '부채', 8), (3, '깃털', 17), (3, '깃털', 17), (3, '돌멩이', 25), (3, '돌멩이', 25),
      (3, '돌멩이', 25), (3, '종이', 33), (3, '종이', 33), (3, '종이', 33), (3, '종이', 33),
      (3, '가죽', 17), (3, '가죽', 17)
    `);
    console.log('✅ 번화가 아이템 추가 완료');
    
    // 터널 (area_id: 4)
    console.log('📝 터널 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (4, '대나무', 17), (4, '대나무', 17), (4, '리본', 17), (4, '리본', 17), (4, '라이터', 25),
      (4, '라이터', 25), (4, '라이터', 25), (4, '레이저 포인터', 25), (4, '레이저 포인터', 25),
      (4, '레이저 포인터', 25), (4, '가죽', 17), (4, '가죽', 17)
    `);
    console.log('✅ 터널 아이템 추가 완료');
    
    // 슬럼가 (area_id: 5)
    console.log('📝 슬럼가 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (5, '분필', 8), (5, '만년필', 17), (5, '만년필', 17), (5, '머리띠', 17), (5, '머리띠', 17),
      (5, '배터리', 42), (5, '배터리', 42), (5, '배터리', 42), (5, '배터리', 42), (5, '배터리', 42),
      (5, '고철', 17), (5, '고철', 17)
    `);
    console.log('✅ 슬럼가 아이템 추가 완료');
    
    // 골목길 (area_id: 6)
    console.log('📝 골목길 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (6, '붕대', 17), (6, '붕대', 17), (6, '쇠구슬', 17), (6, '쇠구슬', 17), (6, '모자', 25),
      (6, '모자', 25), (6, '모자', 25), (6, '물', 25), (6, '물', 25), (6, '물', 25),
      (6, '고철', 17), (6, '고철', 17)
    `);
    console.log('✅ 골목길 아이템 추가 완료');
    
    // 학교 (area_id: 7)
    console.log('📝 학교 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (7, '쌍안경', 17), (7, '쌍안경', 17), (7, '운동화', 17), (7, '운동화', 17), (7, '바람막이', 25),
      (7, '바람막이', 25), (7, '바람막이', 25), (7, '쇠사슬', 25), (7, '쇠사슬', 25), (7, '쇠사슬', 25),
      (7, '고철', 17), (7, '고철', 17)
    `);
    console.log('✅ 학교 아이템 추가 완료');
    
    // 소방서 (area_id: 8)
    console.log('📝 소방서 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (8, '슬리퍼', 8), (8, '유리병', 17), (8, '유리병', 17), (8, '원석', 25), (8, '원석', 25),
      (8, '원석', 25), (8, '철광석', 33), (8, '철광석', 33), (8, '철광석', 33), (8, '철광석', 33),
      (8, '고철', 17), (8, '고철', 17)
    `);
    console.log('✅ 소방서 아이템 추가 완료');
    
    // 고급주택가 (area_id: 9)
    console.log('📝 고급주택가 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (9, '옷감', 8), (9, '접착제', 17), (9, '접착제', 17), (9, '자전거 헬멧', 25), (9, '자전거 헬멧', 25),
      (9, '자전거 헬멧', 25), (9, '화약', 33), (9, '화약', 33), (9, '화약', 33), (9, '화약', 33),
      (9, '고철', 17), (9, '고철', 17)
    `);
    console.log('✅ 고급주택가 아이템 추가 완료');
    
    // 물류창고 (area_id: 10)
    console.log('📝 물류창고 아이템 추가 중...');
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (10, '타이즈', 8), (10, '탄산수', 8), (10, '천갑옷', 25), (10, '천갑옷', 25), (10, '천갑옷', 25),
      (10, '피아노선', 42), (10, '피아노선', 42), (10, '피아노선', 42), (10, '피아노선', 42), (10, '피아노선', 42),
      (10, '고철', 17), (10, '고철', 17)
    `);
    console.log('✅ 물류창고 아이템 추가 완료');
    
    // 최종 확인
    const finalCount = await client.query('SELECT COUNT(*) as count FROM raid_search_area_items');
    console.log(`\n🎉 레이드 조사 데이터 완성! 총 ${finalCount.rows[0].count}개 아이템`);
    
    // 각 지역별 아이템 개수 확인
    console.log('\n📊 각 지역별 아이템 개수:');
    for (let i = 1; i <= 10; i++) {
      const count = await client.query('SELECT COUNT(*) as count FROM raid_search_area_items WHERE area_id = $1', [i]);
      const areaName = await client.query('SELECT name FROM raid_search_areas WHERE id = $1', [i]);
      console.log(`- ${areaName.rows[0].name}: ${count.rows[0].count}개 아이템`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

forceAddRemainingData();
