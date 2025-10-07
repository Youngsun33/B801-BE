const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 51~60 잘못된 선택지 정리 시작');
  const storyId = 1;
  try {
    // from node_id 971~980 (parents), to node_id 28
    const rows = await prisma.$queryRaw`
      SELECT c.id AS choice_id
      FROM choices c
      JOIN nodes nf ON nf.id = c.from_node_id
      JOIN nodes nt ON nt.id = c.to_node_id
      WHERE nf.story_id = ${storyId}
        AND nt.story_id = ${storyId}
        AND nf.node_id BETWEEN 971 AND 980
        AND nt.node_id = 28
    `;

    const ids = rows.map(r => r.choice_id);
    if (!ids.length) {
      console.log('없음: 삭제할 잘못된 선택지');
    } else {
      console.log(`대상 선택지 개수: ${ids.length}`);
      // delete results
      await prisma.$executeRaw`DELETE FROM choice_results WHERE choice_id = ANY(${ids})`;
      // delete constraints
      await prisma.$executeRaw`DELETE FROM choice_constraints WHERE choice_id = ANY(${ids})`;
      // delete choices
      await prisma.$executeRaw`DELETE FROM choices WHERE id = ANY(${ids})`;
      console.log('삭제 완료: choice_results, choice_constraints, choices');
    }
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
