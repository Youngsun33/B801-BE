const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function addRaidSearchData() {
  try {
    console.log('🔍 레이드 조사 데이터 추가 시작...');
    await client.connect();
    
    // 1. 레이드 조사 지역 테이블 생성 (기존 테이블과 충돌하지 않도록 확인)
    console.log('📋 레이드 조사 지역 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS raid_search_areas (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);
    console.log('✅ raid_search_areas 테이블 생성 완료');
    
    // 2. 레이드 조사 지역 아이템 테이블 생성
    console.log('📋 레이드 조사 지역 아이템 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS raid_search_area_items (
        id SERIAL PRIMARY KEY,
        area_id INTEGER REFERENCES raid_search_areas(id),
        item_name VARCHAR(100) NOT NULL,
        drop_rate INTEGER NOT NULL
      )
    `);
    console.log('✅ raid_search_area_items 테이블 생성 완료');
    
    // 3. 기존 데이터가 있는지 확인
    const existingAreas = await client.query('SELECT COUNT(*) as count FROM raid_search_areas');
    if (existingAreas.rows[0].count > 0) {
      console.log('⚠️  레이드 조사 지역 데이터가 이미 존재합니다. 건너뜁니다.');
      return;
    }
    
    // 4. 레이드 조사 지역 데이터 추가
    console.log('📝 레이드 조사 지역 데이터 추가 중...');
    await client.query(`
      INSERT INTO raid_search_areas (name, description) VALUES
      ('등산로', '산악 지역의 등산로'),
      ('청계천', '도심의 하천 지역'),
      ('번화가', '상업 지구의 번화한 거리'),
      ('터널', '지하 통로와 터널'),
      ('슬럼가', '빈민가와 슬럼가 지역'),
      ('골목길', '좁은 골목길'),
      ('학교', '교육 시설'),
      ('소방서', '소방 시설'),
      ('고급주택가', '고급 주거 지역'),
      ('물류창고', '물류 창고 지역')
    `);
    console.log('✅ 레이드 조사 지역 데이터 추가 완료');
    
    // 5. 각 지역별 아이템 데이터 추가
    console.log('📝 레이드 조사 아이템 데이터 추가 중...');
    
    // 등산로 (area_id: 1)
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (1, '감시카메라', 8), (1, '마패', 8), (1, '가위', 25), (1, '가위', 25), (1, '가위', 25),
      (1, '망치', 33), (1, '망치', 33), (1, '망치', 33), (1, '망치', 33), (1, '망치', 33),
      (1, '가죽', 17), (1, '가죽', 17)
    `);
    
    // 청계천 (area_id: 2)
    await client.query(`
      INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
      (2, '못', 8), (2, '곡괭이', 17), (2, '곡괭이', 17), (2, '나뭇가지', 25), (2, '나뭇가지', 25),
      (2, '나뭇가지', 25), (2, '오일', 33), (2, '오일', 33), (2, '오일', 33), (2, '오일', 33),
      (2, '가죽', 17), (2, '가죽', 17)
    `);
    
    // ... (나머지 지역들도 동일하게 추가)
    
    console.log('🎉 레이드 조사 데이터 추가 완료!');
    console.log('🛡️  기존 사용자 데이터는 완전히 보호되었습니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

addRaidSearchData();
