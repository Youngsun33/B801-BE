const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNodesStructure() {
  try {
    console.log('📊 Nodes 테이블 컬럼 구조:');
    const nodeCols = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'nodes' 
      ORDER BY ordinal_position
    `;
    console.log(nodeCols);

    console.log('\n📊 최근 추가된 노드들 (ID 400~450):');
    const recentNodes = await prisma.$queryRaw`
      SELECT * FROM nodes 
      WHERE id >= 400 AND id <= 450 
      ORDER BY id
    `;
    console.log(recentNodes);

    console.log('\n📊 전체 노드 개수:');
    const totalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM nodes`;
    console.log(totalCount);

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNodesStructure();
