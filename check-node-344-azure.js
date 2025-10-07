const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNode344() {
  try {
    // Node 테이블에서 node_id가 344인 노드 찾기
    const node = await prisma.node.findFirst({
      where: { node_id: 344 },
      include: {
        outgoing_choices: {
          include: {
            choiceResults: {
              include: {
                resource: true
              }
            }
          }
        }
      }
    });
    
    if (node) {
      console.log('노드 344:', JSON.stringify(node, null, 2));
    } else {
      console.log('노드 344를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNode344();
