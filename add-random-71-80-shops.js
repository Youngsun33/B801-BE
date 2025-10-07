const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandomShops() {
  console.log('📚 랜덤 상점(71~80) 10개 추가 시작');
  const storyId = 1;

  try {
    const resources = await prisma.$queryRaw`SELECT id, name FROM resources`;
    const r = {};
    for (const row of resources) r[row.name] = row.id;

    async function ensureNode(nodeId, title, text, type = 'random') {
      const exists = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${nodeId}`;
      if (exists.length) return exists[0].id;
      await prisma.$executeRaw`INSERT INTO nodes (story_id, node_id, title, text_content, node_type) VALUES (${storyId}, ${nodeId}, ${title}, ${text}, ${type})`;
      const got = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${nodeId}`;
      console.log(`  ✓ 노드 ${nodeId} 생성: ${title}`);
      return got[0].id;
    }

    async function ensureChoice(fromNodeId, toNodeId, text, orderNum = 1, constraint) {
      const fromDb = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${fromNodeId}`;
      const toDb = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${toNodeId}`;
      if (!fromDb.length || !toDb.length) {
        console.log(`  ⊙ 건너뜀 선택지 ${fromNodeId} → ${toNodeId} (노드 없음)`);
        return null;
      }
      const fromId = fromDb[0].id;
      const toId = toDb[0].id;
      const exists = await prisma.$queryRaw`SELECT id FROM choices WHERE from_node_id=${fromId} AND to_node_id=${toId} AND choice_text=${text}`;
      let choiceId;
      if (!exists.length) {
        const inserted = await prisma.$queryRaw`INSERT INTO choices (from_node_id, to_node_id, choice_text, order_num) VALUES (${fromId}, ${toId}, ${text}, ${orderNum}) RETURNING id`;
        choiceId = inserted[0].id;
        console.log(`  ✓ 선택지: ${fromNodeId} → ${toNodeId}`);
      } else {
        choiceId = exists[0].id;
      }
      if (constraint && r[constraint.name]) {
        const already = await prisma.$queryRaw`SELECT id FROM choice_constraints WHERE choice_id=${choiceId}`;
        if (!already.length) {
          await prisma.$executeRaw`INSERT INTO choice_constraints (choice_id, resource_id, required_value, comparison_type, description) VALUES (${choiceId}, ${r[constraint.name]}, ${constraint.value}, '>=', '레벨 체크')`;
        }
      }
      return choiceId;
    }

    async function ensureResult(choiceId, resName, delta, desc) {
      if (!choiceId) return;
      if (!r[resName]) return console.log(`  ⊙ 리소스 없음: ${resName}`);
      const exists = await prisma.$queryRaw`SELECT id FROM choice_results WHERE choice_id=${choiceId} AND resource_id=${r[resName]}`;
      if (!exists.length) {
        await prisma.$executeRaw`INSERT INTO choice_results (choice_id, resource_id, value_change, description) VALUES (${choiceId}, ${r[resName]}, ${delta}, ${desc})`;
        console.log(`    ↳ 결과: ${resName} ${delta > 0 ? '+' : ''}${delta}`);
      }
    }

    const GO_ON_NODE = 28;

    const baseNodes = [
      { parent: 1201, buy: 1202, skip: 1203 },
      { parent: 1204, buy: 1205, skip: 1206 },
      { parent: 1207, buy: 1208, skip: 1209 },
      { parent: 1210, buy: 1211, skip: 1212 },
      { parent: 1213, buy: 1214, skip: 1215 },
      { parent: 1216, buy: 1217, skip: 1218 },
      { parent: 1219, buy: 1220, skip: 1221 },
      { parent: 1222, buy: 1223, skip: 1224 },
      { parent: 1225, buy: 1226, skip: 1227 },
      { parent: 1228, buy: 1229, skip: 1230 }
    ];

    for (const idx in baseNodes) {
      const { parent, buy, skip } = baseNodes[idx];
      await ensureNode(parent, `7${Number(idx) + 1}. 랜덤 상점`, '"어서옵쇼!!! 없는 것 빼고 다 있습니다!!!"\n\n초록 모포 위 여러 물품들을 올려둔 채 팔고 있는 듯 합니다. 개중 하나가 눈에 들어오네요.', 'random');
      await ensureNode(buy, '- (돈) [능력 선택권]을 산다.', '책 목록 중 하나를 가져갈 수 있다. (* 총괄계 DM에서 사용 가능)', 'random');
      await ensureNode(skip, '- 돈이 어디 있어! 그냥 간다.', '그냥 지나간다.', 'random');

      let ch = await ensureChoice(parent, buy, '- (돈) [능력 선택권]을 산다.', 1, { name: '돈', value: 1 });
      await ensureResult(ch, '돈', -1, '능력 선택권 구매');
      await ensureResult(ch, '능력 선택권', 1, '책 한 권 교환권');

      await ensureChoice(parent, skip, '- 돈이 어디 있어! 그냥 간다.', 2);
      await ensureChoice(buy, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
      await ensureChoice(skip, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    }

    console.log('✅ 랜덤 상점(71~80) 10개 추가 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

addRandomShops();


