const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function setupRaidSearch() {
  try {
    await client.connect();
    console.log('데이터베이스에 연결되었습니다.');

    // 테이블 생성 스크립트 실행
    const createTablesSQL = fs.readFileSync(path.join(__dirname, 'create-raid-search-tables.sql'), 'utf8');
    await client.query(createTablesSQL);
    console.log('레이드서치 테이블이 생성되었습니다.');

    // 데이터 입력 스크립트 실행
    const insertDataSQL = fs.readFileSync(path.join(__dirname, 'insert-raid-search-data.sql'), 'utf8');
    await client.query(insertDataSQL);
    console.log('레이드서치 데이터가 입력되었습니다.');

    // 결과 확인
    const areasResult = await client.query('SELECT COUNT(*) FROM raid_search_areas');
    const itemsResult = await client.query('SELECT COUNT(*) FROM raid_search_area_items');
    
    console.log(`지역 수: ${areasResult.rows[0].count}`);
    console.log(`아이템 수: ${itemsResult.rows[0].count}`);

    // 지역별 아이템 수 확인
    const areaItemsResult = await client.query(`
      SELECT a.name, COUNT(ai.id) as item_count
      FROM raid_search_areas a
      LEFT JOIN raid_search_area_items ai ON a.id = ai.area_id
      GROUP BY a.id, a.name
      ORDER BY a.id
    `);

    console.log('\n지역별 아이템 수:');
    areaItemsResult.rows.forEach(row => {
      console.log(`${row.name}: ${row.item_count}개`);
    });

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
    console.log('데이터베이스 연결이 종료되었습니다.');
  }
}

setupRaidSearch();
