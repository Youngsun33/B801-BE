const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSpecificNodes() {
  console.log('🗑️ 지정 노드 삭제 시작...');
  const targetNodeNumbers = [3301, 3602, 3501, 3601];
  try {
    const rows = await prisma.$queryRaw`
      SELECT id, node_id FROM nodes 
      WHERE story_id = 1 AND node_id IN (${targetNodeNumbers[0]}, ${targetNodeNumbers[1]}, ${targetNodeNumbers[2]}, ${targetNodeNumbers[3]})
    `;

    if (rows.length === 0) {
      console.log('삭제할 노드 없음');
      return;
    }

    for (const row of rows) {
      const nodeId = row.id;
      // choice_results
      await prisma.$executeRaw`
        DELETE FROM choice_results 
        WHERE choice_id IN (
          SELECT id FROM choices 
          WHERE from_node_id = ${nodeId} OR to_node_id = ${nodeId}
        )
      `;
      // choice_constraints
      await prisma.$executeRaw`
        DELETE FROM choice_constraints 
        WHERE choice_id IN (
          SELECT id FROM choices 
          WHERE from_node_id = ${nodeId} OR to_node_id = ${nodeId}
        )
      `;
      // choices
      await prisma.$executeRaw`
        DELETE FROM choices 
        WHERE from_node_id = ${nodeId} OR to_node_id = ${nodeId}
      `;
      // node
      await prisma.$executeRaw`DELETE FROM nodes WHERE id = ${nodeId}`;
      console.log(`  ✓ 삭제: node_id=${row.node_id}`);
    }

    console.log('✅ 지정 노드 삭제 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSpecificNodes();
