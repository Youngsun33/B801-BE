const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCheckpointNodes() {
  try {
    console.log('🔍 체크포인트 노드들 확인 중...');
    
    // node_id가 300번대인 노드들 찾기
    const checkpointNodes = await prisma.mainStory.findMany({
      where: {
        node_id: {
          gte: 300,
          lt: 400
        }
      },
      orderBy: { node_id: 'asc' }
    });
    
    console.log(`📋 체크포인트 노드들 (${checkpointNodes.length}개):`);
    checkpointNodes.forEach(node => {
      console.log(`  - 노드 ${node.node_id}: ${node.title} (${node.node_type})`);
    });
    
    // 100번대 노드들도 확인
    const introNodes = await prisma.mainStory.findMany({
      where: {
        node_id: {
          gte: 100,
          lt: 200
        }
      },
      orderBy: { node_id: 'asc' }
    });
    
    console.log(`\n📋 인트로 노드들 (${introNodes.length}개):`);
    introNodes.forEach(node => {
      console.log(`  - 노드 ${node.node_id}: ${node.title} (${node.node_type})`);
    });
    
    // 전체 노드 개수
    const totalNodes = await prisma.mainStory.count();
    console.log(`\n📊 전체 노드 개수: ${totalNodes}개`);
    
    // 최소/최대 node_id
    const minMax = await prisma.mainStory.aggregate({
      _min: { node_id: true },
      _max: { node_id: true }
    });
    
    console.log(`📊 노드 ID 범위: ${minMax._min.node_id} ~ ${minMax._max.node_id}`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCheckpointNodes();
