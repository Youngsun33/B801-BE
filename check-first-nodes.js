const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFirstNodes() {
  try {
    console.log('🔍 첫 번째 노드들 확인 중...');
    
    // 처음 10개 노드 확인
    const firstNodes = await prisma.mainStory.findMany({
      orderBy: { node_id: 'asc' },
      take: 10
    });
    
    console.log('📋 처음 10개 노드들:');
    firstNodes.forEach(node => {
      console.log(`  - 노드 ${node.node_id}: ${node.title} (${node.node_type})`);
    });
    
    // 루트별 첫 번째 노드들 찾기
    const routeStarts = await prisma.mainStory.findMany({
      where: {
        title: {
          in: ['루트 1', '루트 2', '루트 3']
        }
      },
      orderBy: { node_id: 'asc' }
    });
    
    console.log('\n🎯 루트 시작 노드들:');
    routeStarts.forEach(node => {
      console.log(`  - ${node.title}: 노드 ${node.node_id}`);
    });
    
    // 체크포인트 타입 노드들 찾기
    const checkpoints = await prisma.mainStory.findMany({
      where: {
        node_type: 'checkpoint'
      },
      orderBy: { node_id: 'asc' }
    });
    
    console.log('\n📍 체크포인트 노드들:');
    checkpoints.forEach(node => {
      console.log(`  - 노드 ${node.node_id}: ${node.title} (${node.route_name})`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFirstNodes();
