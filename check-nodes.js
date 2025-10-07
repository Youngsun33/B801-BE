const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNodes() {
  try {
    console.log('📊 최근 추가된 노드들 (ID 400~450):');
    const recentNodes = await prisma.$queryRaw`
      SELECT id, title, type, created_at 
      FROM nodes 
      WHERE id >= 400 AND id <= 450 
      ORDER BY id
    `;
    console.log(recentNodes);

    console.log('\n📊 랜덤 타입 노드들:');
    const randomNodes = await prisma.$queryRaw`
      SELECT id, title, type 
      FROM nodes 
      WHERE type = 'random' 
      ORDER BY id DESC 
      LIMIT 20
    `;
    console.log(randomNodes);

    console.log('\n📊 전체 노드 개수:');
    const totalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM nodes`;
    console.log(totalCount);

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNodes();
