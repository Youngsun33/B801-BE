import { prisma } from '../src/lib/prisma';

async function getNodePkByNumber(nodeNumber: number): Promise<number | null> {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT id FROM nodes WHERE node_id = ${nodeNumber} LIMIT 1
  `;
  return rows.length > 0 ? Number(rows[0].id) : null;
}

async function ensureNode(nodeNumber: number, title: string, text: string, nodeType: string = 'main') {
  const exists = await prisma.$queryRaw<any[]>`
    SELECT id FROM nodes WHERE node_id = ${nodeNumber}
  `;
  if (exists.length > 0) {
    await prisma.$executeRaw`
      UPDATE nodes SET title = ${title}, text_content = ${text}, node_type = ${nodeType}
      WHERE node_id = ${nodeNumber}
    `;
    return Number(exists[0].id);
  }
  const inserted = await prisma.$queryRaw<any[]>`
    INSERT INTO nodes (story_id, node_id, title, text_content, node_type)
    VALUES (1, ${nodeNumber}, ${title}, ${text}, ${nodeType})
    RETURNING id
  `;
  return Number(inserted[0].id);
}

async function ensureChoice(fromNodeNumber: number, toNodeNumber: number, label: string, orderNum: number, constraint?: { name: string; value: number }) {
  const fromPk = await getNodePkByNumber(fromNodeNumber);
  const toPk = await getNodePkByNumber(toNodeNumber);
  if (fromPk == null || toPk == null) {
    throw new Error(`노드 PK 확인 실패: from=${fromNodeNumber}(${fromPk}), to=${toNodeNumber}(${toPk})`);
  }

  // 동일 텍스트/순서의 선택지 존재 시 갱신, 없으면 생성
  const existing = await prisma.$queryRaw<any[]>`
    SELECT id FROM choices WHERE from_node_id = ${fromPk} AND order_num = ${orderNum}
  `;
  let choiceId: number;
  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE choices SET to_node_id = ${toPk}, choice_text = ${label}, is_available = true
      WHERE id = ${existing[0].id}
    `;
    choiceId = Number(existing[0].id);
  } else {
    const inserted = await prisma.$queryRaw<any[]>`
      INSERT INTO choices (from_node_id, to_node_id, choice_text, order_num, is_available)
      VALUES (${fromPk}, ${toPk}, ${label}, ${orderNum}, true)
      RETURNING id
    `;
    choiceId = Number(inserted[0].id);
  }

  // 제약조건(선택지 요구 능력) 처리: 단일 STAT/SKILL 리소스에 대해서만 보정
  if (constraint) {
    const resRows = await prisma.$queryRaw<any[]>`
      SELECT id FROM resources WHERE name = ${constraint.name} LIMIT 1
    `;
    if (resRows.length > 0) {
      const resourceId = Number(resRows[0].id);
      const has = await prisma.$queryRaw<any[]>`
        SELECT id FROM choice_constraints WHERE choice_id = ${choiceId} AND resource_id = ${resourceId}
      `;
      if (has.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO choice_constraints (choice_id, resource_id, required_value, comparison_type, description)
          VALUES (${choiceId}, ${resourceId}, ${constraint.value}, '>=' , ${constraint.name})
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE choice_constraints SET required_value = ${constraint.value}
          WHERE id = ${has[0].id}
        `;
      }
    }
  }

  return choiceId;
}

async function main() {
  console.log('🔧 노드 32 클러스터 보정 시작');

  // 원본 텍스트 구성
  const n32Title = '- 어떻게 되는데요?';
  const n32Text = '"그에 상응하는 당신의 무언가를 가져가야겠지. 뭐……. 내가 보기에는 목숨밖에 없어 보이는군."\n\n코웃음을 친 남자는 지체 없이 아랫사람을 불러와 판을 깝니다. 어디 한 번, 제대로 놀아볼까요.';

  const n33Title = '- (손재주 Lv.3) 화려한 기술로 남자를 제압한다.';
  const n33Text = '"이럴수가……!"\n\n남자는 결과를 믿을 수 없다는 듯 망연자실한 표정이 스칩니다. 하지만 이내 언제 그랬냐는 듯, 예의 젠틀한 미소를 지으며 당신을 개인적인 방으로 안내합니다.\n\n"마음 같아서는 너를 여기서 내보내고 싶지 않지만. 장사 하루 이틀 하는 것도 아니고. 정보를 주기는 해야겠지."\n\n한참 뜸을 들이던 남자는 싱긋 웃으며 말을 잇습니다.\n\n"내 금고는 오프 내 주 세력 건물 최상층에 있어. 아마 이렇게 말하면 알아들을 거야. 제법 웃기겠어. 나조차도 찾지 못하는 금고를 무슨 수로 찾으려고."\n\n설마 당신이 누구의 의뢰를 받고 온 건지 알아채고 한 말인가요? 정확한 건 알 수 없지만 굉장히 찝찝합니다. 우선은 정보를 얻었으니 태영루에게 알리러 가야겠죠.';

  const n34Title = '(성공) - 정석적으로 플레이한다.';
  const n34Text = '"이럴수가……!"\n\n남자는 결과를 믿을 수 없다는 듯 망연자실한 표정이 스칩니다. 하지만 이내 언제 그랬냐는 듯, 예의 젠틀한 미소를 지으며 당신을 개인적인 방으로 안내합니다.\n\n"마음 같아서는 너를 여기서 내보내고 싶지 않지만. 장사 하루 이틀 하는 것도 아니고. 정보를 주기는 해야겠지."\n\n한참 뜸을 들이던 남자는 싱긋 웃으며 말을 잇습니다.\n\n"내 금고는 오프 내 주 세력 건물 최상층에 있어. 아마 이렇게 말하면 알아들을 거야. 제법 웃기겠어. 나조차도 찾지 못하는 금고를 무슨 수로 찾으려고."\n\n설마 당신이 누구의 의뢰를 받고 온 건지 알아채고 한 말인가요? 정확한 건 알 수 없지만 굉장히 찝찝합니다. 우선은 정보를 얻었으니 태영루에게 알리러 가야겠죠.\n\n* 다음 이야기는 익일 조사부터 진행 가능합니다.';

  const n35Title = '(실패) - 정석적으로 플레이한다.';
  const n35Text = '"하하! 이런 애송이가 나한테 덤비다니. 겁이 없군. 이건 대가로 받아가겠어."\n\n남자가 호탕하게 웃음을 터트리며 당신 수중의 돈을 털어갑니다. (돈 -1)';

  const n36Title = '- 이런!';
  const n36Text = '어쩔 수 없죠. 좀 더 정진하고 다시 와야겠어요…….';

  const n37Title = '- 태영루로 간다.';
  const n37Text = '';

  // 노드 보장/업서트
  await ensureNode(32, n32Title, n32Text, 'main');
  await ensureNode(33, n33Title, n33Text, 'main');
  await ensureNode(34, n34Title, n34Text, 'main');
  await ensureNode(35, n35Title, n35Text, 'main');
  await ensureNode(36, n36Title, n36Text, 'main');
  await ensureNode(37, n37Title, n37Text, 'main');

  // 선택지 보장
  // 32 → 33 (손재주 Lv.3)
  await ensureChoice(32, 33, '- (손재주 Lv.3) 화려한 기술로 남자를 제압한다.', 1, { name: '손재주', value: 3 });
  // 32 → 34 (성공)
  await ensureChoice(32, 34, '(성공)- 정석적으로 플레이한다.', 2);
  // 32 → 35 (실패)
  await ensureChoice(32, 35, '(실패)- 정석적으로 플레이한다.', 3);

  // 33 → 37 태영루
  await ensureChoice(33, 37, '- 태영루로 간다.', 1);
  // 34 → 37 태영루
  await ensureChoice(34, 37, '- 태영루로 간다.', 1);
  // 35 → 36 이런!
  await ensureChoice(35, 36, '- 이런!', 1);
  // 36 → (허브/다음) 임시로 500 허브가 있다면 그쪽, 없으면 1로 이동
  const has500 = await getNodePkByNumber(500);
  const nextAfter36 = has500 ? 500 : 1;
  await ensureChoice(36, nextAfter36, '- 서울을 돌아다닌다.', 1);

  console.log('✅ 노드 32 클러스터 보정 완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


