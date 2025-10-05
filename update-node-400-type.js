const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateNode400Type() {
  try {
    console.log('🔧 노드 400 타입 업데이트 중...');
    
    // 노드 400의 node_type을 ability_selection으로 변경
    await prisma.mainStory.update({
      where: { node_id: 400 },
      data: {
        node_type: 'ability_selection'
      }
    });
    
    console.log('✅ 노드 400 타입을 ability_selection으로 변경 완료!');
    
    // 확인
    const updatedNode = await prisma.mainStory.findUnique({
      where: { node_id: 400 }
    });
    
    console.log(`📋 업데이트된 노드 400:`);
    console.log(`  - 제목: ${updatedNode?.title}`);
    console.log(`  - 타입: ${updatedNode?.node_type}`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNode400Type();
