const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandom3340() {
  console.log('📚 랜덤 스토리 33~40 추가 시작');
  const storyId = 1;

  try {
    const resources = await prisma.$queryRaw`SELECT id, name FROM resources`;
    const r = {};
    for (const row of resources) r[row.name] = row.id;

    // Helper: upsert node
    async function ensureNode(nodeId, title, text, type = 'random') {
      const exists = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${nodeId}`;
      if (exists.length) return exists[0].id;
      await prisma.$executeRaw`INSERT INTO nodes (story_id, node_id, title, text_content, node_type) VALUES (${storyId}, ${nodeId}, ${title}, ${text}, ${type})`;
      const got = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${nodeId}`;
      console.log(`  ✓ 노드 ${nodeId} 생성: ${title}`);
      return got[0].id;
    }

    // Helper: ensure choice and optional constraint
    async function ensureChoice(fromNodeId, toNodeId, text, orderNum = 1, constraint) {
      const fromDb = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${fromNodeId}`;
      const toDb = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id=${storyId} AND node_id=${toNodeId}`;
      if (!fromDb.length || !toDb.length) {
        console.log(`  ⊙ 건너뜀 선택지 ${fromNodeId} → ${toNodeId} (노드 없음)`);
        return null;
      }
      const fromId = fromDb[0].id;
      const toId = toDb[0].id;
      const exists = await prisma.$queryRaw`SELECT id FROM choices WHERE from_node_id=${fromId} AND to_node_id=${toId}`;
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

    // 모든 종료는 28로 연결
    const GO_ON_NODE = 28;

    // 33. 살해당한 시체 (정신력 -1)
    await ensureNode(901, '33. 살해당한 시체', '잠깐. 방금 듣지 못했나요?\n\n무엇을요?\n\n다시다시. 귀를 기울여 보세요.', 'random');
    await ensureNode(902, '- 어?', '"으…… 욱."\n\n이건 분명히 고통에 찬 신음 소리입니다. 그리고 이어지는, 생살이 찢어지는 소리가 하나, 둘, 수차례 들리고. 한 사람을 둘러싼 대여섯 명 정도 되는 사람들의 희열에 찬 웃음소리가 울려 퍼집니다. 당신은 무의식적으로 뒷걸음질 치기 시작합니다. 저건 명백한 살인입니다. 살인인가요? 그저 놀이일지도 모르겠네요. 이런 서울에서 힘없는 자는 한낱 놀잇감이 될 뿐입니다.', 'random');
    await ensureNode(903, '- 안 들리는데요.', '그냥 지나갑니다.', 'random');
    let ch = await ensureChoice(901, 902, '- 어?', 1);
    await ensureResult(ch, '정신력', -1, '살해 현장 소리로 정신력 하락');
    await ensureChoice(901, 903, '- 안 들리는데요.', 2);
    await ensureChoice(902, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(903, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 34. 녹아내린 동물 (정신력 -1)
    await ensureNode(904, '34. 녹아내린 동물', '이게 무슨 냄새죠? 이제껏 맡던 익숙한 악취와는 또 다릅니다. 인위적이고 또…… 불쾌합니다. 발끝에 닿는 감각. 복부가 녹아내린 동물 사체들이 길을 적십니다.', 'random');
    ch = await ensureChoice(904, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureResult(ch, '정신력', -1, '녹아내린 사체를 보고 정신력 하락');

    // 35. 거울 (정신력 +1)
    await ensureNode(905, '35. 거울', '도로를 걷다 보니 반짝, 하고 눈이 부십니다. 반사경입니다. 반 정도 깨졌지만 당신을 살피기엔 충분합니다.', 'random');
    await ensureNode(906, '- 멋진 내 모습!', '사과 같은 내 얼굴. 여전히 아름다운 모습입니다. 조금 꼬질하지만요!', 'random');
    await ensureNode(907, '- 보고 싶지 않아요.', '그냥 지나갑니다.', 'random');
    ch = await ensureChoice(905, 906, '- 멋진 내 모습!', 1);
    await ensureResult(ch, '정신력', 1, '거울로 자신을 다독여 정신력 상승');
    await ensureChoice(905, 907, '- 보고 싶지 않아요.', 2);
    await ensureChoice(906, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(907, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 36. 헬창 (근력 +1) / (근력 Lv.2) 보상: 근력+1, 체력+1
    await ensureNode(908, '36. 헬창', '“머슬머슬! 근손실 아웃!” 헬스 트레이너가 운동을 권합니다.', 'random');
    await ensureNode(909, '- 가르쳐 주십쇼 스승님!', '열정적으로 운동한다.', 'random');
    await ensureNode(910, '- (근력 lv.2) 저도 힘하면 지지 않습니다.', '호적수를 만났다며 영양제를 건넵니다.', 'random');
    ch = await ensureChoice(908, 909, '- 가르쳐 주십쇼 스승님!', 1);
    await ensureResult(ch, '근력', 1, '운동으로 근력 상승');
    ch = await ensureChoice(908, 910, '- (근력 lv.2) 저도 힘하면 지지 않습니다.', 2, { name: '근력', value: 2 });
    await ensureResult(ch, '근력', 1, '호적수 인정으로 근력 상승');
    await ensureResult(ch, '체력', 1, '영양제로 체력 상승');
    await ensureChoice(909, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(910, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 37. 트럭 뺑소니 (체력 -1)
    await ensureNode(911, '37. 트럭 뺑소니', '빵빵빵! 트럭이 돌진합니다.', 'random');
    await ensureNode(912, '- (민첩함 Lv.2) 어림도 없지!', '죽지 않은 게 다행입니다. 운전자가 쌍욕을 하고 떠납니다.', 'random');
    await ensureNode(913, '- (성공) 으악!!', '죽지 않은 게 다행입니다. 운전자가 쌍욕을 하고 떠납니다.', 'random');
    await ensureNode(914, '- (실패) 으악!!', '급브레이크와 함께 바닥에 자빠집니다.', 'random');
    await ensureChoice(911, 912, '- (민첩함 Lv.2) 어림도 없지!', 1, { name: '민첩함', value: 2 });
    await ensureChoice(911, 913, '- (성공) 으악!!', 2);
    ch = await ensureChoice(911, 914, '- (실패) 으악!!', 3);
    await ensureResult(ch, '체력', -1, '트럭에 스쳐 체력 하락');
    await ensureChoice(912, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(913, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(914, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 38. 묻지마 푹찍범 (체력)
    await ensureNode(915, '38. 묻지마 푹찍범', '얼굴을 가린 사람이 수상쩍게 다가옵니다.', 'random');
    await ensureNode(916, '- 으아악!', '허벅지를 찌르고 도망칩니다.', 'random');
    await ensureNode(917, '- (강아지) 짖어!', '강아지가 으르렁거리자 달아납니다. 날카로운 유리 조각을 얻었습니다.', 'random');
    ch = await ensureChoice(915, 916, '- 으아악!', 1);
    await ensureResult(ch, '체력', -1, '흉기에 찔림');
    await ensureChoice(915, 917, '- (강아지) 짖어!', 2, { name: '강아지', value: 1 });
    await ensureChoice(916, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(917, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 39. 날아가는 새 잡기 (사격술/식량)
    await ensureNode(918, '39. 날아가는 새 잡기', '하늘로 날아가는 새를 노립니다.', 'random');
    await ensureNode(919, '- (권총) 새를 향해 쏜다.', '사냥 성공!', 'random');
    await ensureNode(920, '- (저격소총) 새를 향해 쏜다.', '사냥 성공!', 'random');
    await ensureNode(921, '- (성공) 돌멩이를 던진다.', '던진 돌이 직격으로 맞았습니다!', 'random');
    await ensureNode(922, '- (실패) 돌멩이를 던진다.', '돌이 빗나갔습니다.', 'random');
    ch = await ensureChoice(918, 919, '- (권총) 새를 향해 쏜다.', 1, { name: '권총', value: 1 });
    await ensureResult(ch, '사격술', 1, '권총 사냥으로 사격술 상승');
    await ensureResult(ch, '식량', 1, '사냥한 새');
    ch = await ensureChoice(918, 920, '- (저격소총) 새를 향해 쏜다.', 2, { name: '저격 소총', value: 1 });
    if (!ch) ch = await ensureChoice(918, 920, '- (저격소총) 새를 향해 쏜다.', 2, { name: '저격소총', value: 1 });
    await ensureResult(ch, '사격술', 1, '저격 사냥으로 사격술 상승');
    await ensureResult(ch, '식량', 1, '사냥한 새');
    ch = await ensureChoice(918, 921, '- (성공) 돌멩이를 던진다.', 3);
    await ensureResult(ch, '식량', 1, '돌로 새를 맞힘');
    await ensureChoice(918, 922, '- (실패) 돌멩이를 던진다.', 4);
    await ensureChoice(919, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(920, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(921, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(922, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 40. 어설픈 소매치기 (선행/악행/돈)
    await ensureNode(923, '40. 어설픈 소매치기', '아이 하나가 부딪히며 돈이 사라집니다.', 'random');
    await ensureNode(924, '- 따라가 붙잡는다.', '아이가 더 빠르게 달립니다.', 'random');
    await ensureNode(925, '- 그냥 따라가지 않고 간다.', '주머니가 가벼워졌습니다.', 'random');
    await ensureNode(926, '- (민첩함) 따라가 붙잡는다.', '금세 따라가 붙잡았습니다.', 'random');
    await ensureNode(927, '- 그냥 아이를 놓아 준다.', '아이가 인사하고 사라집니다.', 'random');
    await ensureNode(928, '- 거짓말 마!', '아이가 울며 돈을 돌려줍니다.', 'random');

    await ensureChoice(923, 924, '- 따라가 붙잡는다.', 1);
    ch = await ensureChoice(923, 925, '- 그냥 따라가지 않고 간다.', 2);
    await ensureResult(ch, '돈', -1, '소매치기로 돈 분실');

    await ensureChoice(924, 926, '- (민첩함) 따라가 붙잡는다.', 1, { name: '민첩함', value: 1 });
    await ensureChoice(924, 927, '- 그냥 보내 준다.', 2);

    ch = await ensureChoice(926, 927, '- 그냥 아이를 놓아 준다.', 1);
    await ensureResult(ch, '선행', 1, '아이를 놓아줌');
    await ensureResult(ch, '돈', -1, '훔친 돈은 돌려줌');

    ch = await ensureChoice(926, 928, '- 거짓말 마!', 2);
    await ensureResult(ch, '악행', 1, '아이를 윽박지름');

    await ensureChoice(925, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(926, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(927, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(928, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    console.log('✅ 랜덤 33~40 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

addRandom3340();
