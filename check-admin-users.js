const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
});

async function checkAdminUsers() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 모든 유저의 role 확인
    console.log('\n👥 모든 유저의 role 확인:');
    const result = await client.query(`
      SELECT id, username, role 
      FROM users 
      ORDER BY id
    `);
    
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Role: ${user.role || 'NULL'}`);
    });

    // admin role이 있는 유저가 있는지 확인
    const adminUsers = result.rows.filter(user => user.role === 'admin');
    console.log(`\n👑 관리자 권한이 있는 유저: ${adminUsers.length}명`);
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️ 관리자 권한이 있는 유저가 없습니다!');
      console.log('관리자 권한을 설정할 유저를 선택해주세요:');
      result.rows.forEach(user => {
        console.log(`${user.id}. ${user.username}`);
      });
      
      // 첫 번째 유저를 관리자로 설정
      if (result.rows.length > 0) {
        const firstUser = result.rows[0];
        console.log(`\n🔧 ${firstUser.username}을 관리자로 설정합니다...`);
        
        await client.query(`
          UPDATE users 
          SET role = 'admin' 
          WHERE id = $1
        `, [firstUser.id]);
        
        console.log(`✅ ${firstUser.username}이 관리자로 설정되었습니다!`);
      }
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

checkAdminUsers();

