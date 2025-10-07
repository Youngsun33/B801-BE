const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://b801admin:admin123!@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function fixRaidData() {
  try {
    await client.connect();
    console.log('데이터베이스에 연결되었습니다.');

    // 기존 데이터 삭제
    await client.query('DELETE FROM raid_search_area_items');
    console.log('기존 아이템 데이터가 삭제되었습니다.');

    // 올바른 데이터 삽입
    const areaData = [
      {
        area: '등산로',
        items: [
          { name: '감시카메라', count: 1, rate: 8 },
          { name: '마패', count: 1, rate: 8 },
          { name: '가위', count: 3, rate: 25 },
          { name: '망치', count: 5, rate: 42 },
          { name: '가죽', count: 2, rate: 17 }
        ]
      },
      {
        area: '청계천',
        items: [
          { name: '못', count: 1, rate: 8 },
          { name: '곡괭이', count: 2, rate: 17 },
          { name: '나뭇가지', count: 3, rate: 25 },
          { name: '오일', count: 4, rate: 33 },
          { name: '가죽', count: 2, rate: 17 }
        ]
      },
      {
        area: '번화가',
        items: [
          { name: '부채', count: 1, rate: 8 },
          { name: '깃털', count: 2, rate: 17 },
          { name: '돌멩이', count: 3, rate: 25 },
          { name: '종이', count: 4, rate: 33 },
          { name: '가죽', count: 2, rate: 17 }
        ]
      },
      {
        area: '터널',
        items: [
          { name: '대나무', count: 2, rate: 17 },
          { name: '리본', count: 2, rate: 17 },
          { name: '라이터', count: 3, rate: 25 },
          { name: '레이저 포인터', count: 3, rate: 25 },
          { name: '가죽', count: 2, rate: 17 }
        ]
      },
      {
        area: '슬럼가',
        items: [
          { name: '분필', count: 1, rate: 8 },
          { name: '만년필', count: 2, rate: 17 },
          { name: '머리띠', count: 2, rate: 17 },
          { name: '배터리', count: 5, rate: 42 },
          { name: '고철', count: 2, rate: 17 }
        ]
      },
      {
        area: '골목길',
        items: [
          { name: '붕대', count: 2, rate: 17 },
          { name: '쇠구슬', count: 2, rate: 17 },
          { name: '모자', count: 3, rate: 25 },
          { name: '물', count: 3, rate: 25 },
          { name: '고철', count: 2, rate: 17 }
        ]
      },
      {
        area: '학교',
        items: [
          { name: '쌍안경', count: 2, rate: 17 },
          { name: '운동화', count: 2, rate: 17 },
          { name: '바람막이', count: 3, rate: 25 },
          { name: '쇠사슬', count: 3, rate: 25 },
          { name: '고철', count: 2, rate: 17 }
        ]
      },
      {
        area: '소방서',
        items: [
          { name: '슬리퍼', count: 1, rate: 8 },
          { name: '유리병', count: 2, rate: 17 },
          { name: '원석', count: 3, rate: 25 },
          { name: '철광석', count: 4, rate: 33 },
          { name: '고철', count: 2, rate: 17 }
        ]
      },
      {
        area: '고급주택가',
        items: [
          { name: '옷감', count: 1, rate: 8 },
          { name: '접착제', count: 2, rate: 17 },
          { name: '자전거 헬멧', count: 3, rate: 25 },
          { name: '화약', count: 4, rate: 33 },
          { name: '고철', count: 2, rate: 17 }
        ]
      },
      {
        area: '물류창고',
        items: [
          { name: '타이즈', count: 1, rate: 8 },
          { name: '탄산수', count: 1, rate: 8 },
          { name: '천갑옷', count: 3, rate: 25 },
          { name: '피아노선', count: 5, rate: 42 },
          { name: '고철', count: 2, rate: 17 }
        ]
      }
    ];

    for (const areaInfo of areaData) {
      // 지역 ID 조회
      const areaResult = await client.query('SELECT id FROM raid_search_areas WHERE name = $1', [areaInfo.area]);
      const areaId = areaResult.rows[0].id;

      // 각 아이템에 대해 개수만큼 레코드 생성
      for (const item of areaInfo.items) {
        for (let i = 0; i < item.count; i++) {
          await client.query(
            'INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES ($1, $2, $3)',
            [areaId, item.name, item.rate]
          );
        }
      }
    }

    console.log('레이드서치 데이터가 수정되었습니다.');

    // 결과 확인
    const result = await client.query(`
      SELECT a.name as area_name, ai.item_name, COUNT(*) as count
      FROM raid_search_areas a
      LEFT JOIN raid_search_area_items ai ON a.id = ai.area_id
      GROUP BY a.id, a.name, ai.item_name
      ORDER BY a.id, ai.item_name
    `);

    console.log('\n지역별 아이템 데이터 (수정 후):');
    let currentArea = '';
    result.rows.forEach(row => {
      if (row.area_name !== currentArea) {
        currentArea = row.area_name;
        console.log(`\n=== ${currentArea} ===`);
      }
      console.log(`- ${row.item_name} x${row.count}`);
    });

    // 총 아이템 수 확인
    const totalResult = await client.query('SELECT COUNT(*) FROM raid_search_area_items');
    console.log(`\n총 아이템 수: ${totalResult.rows[0].count}개`);

    await client.end();
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

fixRaidData();
