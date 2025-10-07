import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔧 choices 외래키(from/to_node_id) 교정 시작');

  // 1) from_node_id가 nodes.node_id를 잘못 가리키는 경우 PK(id)로 교정
  const badFrom = await prisma.$queryRaw<any[]>`
    SELECT c.id AS choice_id, c.from_node_id AS from_raw, n.id AS should_be
    FROM choices c
    JOIN nodes n ON n.node_id = c.from_node_id
    WHERE c.from_node_id <> n.id
  `;
  if (badFrom.length > 0) {
    console.log(`  ▶ from_node_id 교정 대상: ${badFrom.length}개`);
    for (const row of badFrom) {
      await prisma.$executeRaw`
        UPDATE choices SET from_node_id = ${row.should_be} WHERE id = ${row.choice_id}
      `;
    }
  } else {
    console.log('  ▶ from_node_id 교정 대상 없음');
  }

  // 2) to_node_id가 nodes.node_id를 잘못 가리키는 경우 PK(id)로 교정
  const badTo = await prisma.$queryRaw<any[]>`
    SELECT c.id AS choice_id, c.to_node_id AS to_raw, n.id AS should_be
    FROM choices c
    JOIN nodes n ON n.node_id = c.to_node_id
    WHERE c.to_node_id <> n.id
  `;
  if (badTo.length > 0) {
    console.log(`  ▶ to_node_id 교정 대상: ${badTo.length}개`);
    for (const row of badTo) {
      await prisma.$executeRaw`
        UPDATE choices SET to_node_id = ${row.should_be} WHERE id = ${row.choice_id}
      `;
    }
  } else {
    console.log('  ▶ to_node_id 교정 대상 없음');
  }

  // 3) 노드 32, 69의 연결 상태 출력(검증)
  const rows32 = await prisma.$queryRaw<any[]>`
    SELECT n.id AS node_pk, n.node_id, c.id AS choice_id, c.choice_text, tn.node_id AS target_node
    FROM nodes n
    LEFT JOIN choices c ON c.from_node_id = n.id
    LEFT JOIN nodes tn ON tn.id = c.to_node_id
    WHERE n.node_id = 32
    ORDER BY c.order_num
  `;
  console.log('\n📌 노드 32 선택지');
  console.table(rows32);

  const rows69 = await prisma.$queryRaw<any[]>`
    SELECT n.id AS node_pk, n.node_id, c.id AS choice_id, c.choice_text, tn.node_id AS target_node
    FROM nodes n
    LEFT JOIN choices c ON c.from_node_id = n.id
    LEFT JOIN nodes tn ON tn.id = c.to_node_id
    WHERE n.node_id = 69
    ORDER BY c.order_num
  `;
  console.log('\n📌 노드 69 선택지');
  console.table(rows69);

  // 4) 전역 무결성 점검
  const broken = await prisma.$queryRaw<any[]>`
    SELECT c.id AS bad_choice_id, c.choice_text, c.from_node_id, c.to_node_id
    FROM choices c
    LEFT JOIN nodes f ON f.id = c.from_node_id
    LEFT JOIN nodes t ON t.id = c.to_node_id
    WHERE f.id IS NULL OR t.id IS NULL
  `;
  if (broken.length > 0) {
    console.warn(`\n⚠️ 아직 끊긴 선택지 ${broken.length}개 존재`);
    console.table(broken.slice(0, 20));
  } else {
    console.log('\n✅ 끊긴 선택지 없음');
  }

  console.log('\n🎉 외래키 교정 완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


