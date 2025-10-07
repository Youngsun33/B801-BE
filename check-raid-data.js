const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkData() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT a.name as area_name, ai.item_name, ai.drop_rate
      FROM raid_search_areas a
      LEFT JOIN raid_search_area_items ai ON a.id = ai.area_id
      ORDER BY a.id, ai.item_name
    `);
    
    console.log('지역별 아이템 데이터:');
    let currentArea = '';
    result.rows.forEach(row => {
      if (row.area_name !== currentArea) {
        currentArea = row.area_name;
        console.log(`\n=== ${currentArea} ===`);
      }
      console.log(`- ${row.item_name} (드롭률: ${row.drop_rate}%)`);
    });
    
    await client.end();
  } catch (error) {
    console.error('오류:', error);
  }
}

checkData();
