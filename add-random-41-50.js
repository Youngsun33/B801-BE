const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandom41to50() {
  console.log('📚 랜덤 스토리 41~50 추가 시작');
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

    const GO_ON_NODE = 28;

    // 41. 폭탄 판매상 (돈 -1)
    await ensureNode(931, '41. 폭탄 판매상', '수류탄을 판다는 수상한 판매상.', 'random');
    await ensureNode(932, '- (돈) 구매한다.', '사기였다. 파인애플 모양 돌.', 'random');
    await ensureNode(933, '- 그냥 사지 않고 간다.', '그냥 지나간다.', 'random');
    let ch = await ensureChoice(931, 932, '- (돈) 구매한다.', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '가짜 폭탄 구매');
    await ensureChoice(931, 933, '- 그냥 사지 않고 간다.', 2);
    await ensureChoice(932, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(933, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 42. 아타시와 삐에로 (정신력 +1, 돈 -1, 식량 +1)
    await ensureNode(934, '42. 아타시와 삐에로', '광대의 저글링 공연.', 'random');
    await ensureNode(935, '- 광대에게 다가간다.', '가까이서 구경한다.', 'random');
    await ensureNode(936, '- 박수!', '동심이 샘솟는다.', 'random');
    await ensureNode(937, '- (돈) 돈을 넣는다.', '풍선 인형과 사과를 받는다.', 'random');
    await ensureNode(938, '- 그만 구경하고 간다.', '그만 보고 간다.', 'random');
    await ensureChoice(934, 935, '- 광대에게 다가간다.', 1);
    ch = await ensureChoice(935, 936, '- 박수!', 1);
    await ensureResult(ch, '정신력', 1, '공연 감상으로 기분 전환');
    ch = await ensureChoice(935, 937, '- (돈) 돈을 넣는다.', 2, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '공연에 기부');
    await ensureResult(ch, '정신력', 1, '공연 감동');
    await ensureResult(ch, '식량', 1, '사과를 받음');
    await ensureChoice(935, 938, '- 그만 구경하고 간다.', 3);
    await ensureChoice(936, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(937, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(938, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 43. 병든 사람 (정신력-1 / 의약품 -1, 정신력 +1, 선행 +1)
    await ensureNode(939, '43. 병든 사람', '열꽃이 피어난 병든 사람을 만난다.', 'random');
    await ensureNode(940, '- 뭘 봐요?', '기분만 나빠졌다.', 'random');
    await ensureNode(941, '- (의약품) 도와준다.', '의약품을 건넨다.', 'random');
    ch = await ensureChoice(939, 940, '- 뭘 봐요?', 1);
    await ensureResult(ch, '정신력', -1, '혐오스런 장면');
    ch = await ensureChoice(939, 941, '- (의약품) 도와준다.', 2, { name: '의약품', value: 1 });
    await ensureResult(ch, '의약품', -1, '의약품 사용');
    await ensureResult(ch, '정신력', 1, '사람을 도와 안도');
    await ensureResult(ch, '선행', 1, '선행을 베풂');
    await ensureChoice(940, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(941, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 44. 부패한 물 마시는 사람 (정신력 +1)
    await ensureNode(942, '44. 부패한 물 마시는 사람', '역겨운 물을 마시는 사람을 본다.', 'random');
    ch = await ensureChoice(942, GO_ON_NODE, '- 그랬었나?', 1);
    await ensureResult(ch, '정신력', 1, '상대적 축복을 실감');

    // 45. 도박판 (손재주, 돈)
    await ensureNode(943, '45. 도박판', '화투판이 벌어지고 있다.', 'random');
    await ensureNode(944, '- (손재주) 화려한 밑장빼기로 돈을 털어먹는다.', '도박판에서 이긴다.', 'random');
    await ensureNode(945, '- 도박판에 참가한다.', '초심자의 행운.', 'random');
    await ensureNode(946, '- 그냥 참가하지 않고 간다.', '지나간다.', 'random');
    ch = await ensureChoice(943, 944, '- (손재주) 화려한 밑장빼기로 돈을 털어먹는다.', 1, { name: '손재주', value: 1 });
    await ensureResult(ch, '돈', 2, '도박판 승리');
    await ensureResult(ch, '손재주', 1, '화려한 기술');
    ch = await ensureChoice(943, 945, '- 도박판에 참가한다.', 2);
    await ensureResult(ch, '손재주', 1, '손기술이 는 기분');
    await ensureChoice(943, 946, '- 그냥 참가하지 않고 간다.', 3);
    await ensureChoice(944, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(945, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(946, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 46. 팔씨름 (근력, 저격소총)
    await ensureNode(947, '46. 팔씨름', '팔씨름을 제안하는 남자.', 'random');
    await ensureNode(948, '- (근력) 머슬머슬!', '바로 이긴다.', 'random');
    await ensureNode(949, '- (성공) 이얍!', '운 좋게 이긴다.', 'random');
    await ensureNode(950, '- (실패) 이얍!', '아쉽게 진다.', 'random');
    ch = await ensureChoice(947, 948, '- (근력) 머슬머슬!', 1, { name: '근력', value: 1 });
    await ensureResult(ch, '근력', 1, '팔씨름 승리');
    await ensureResult(ch, '저격소총', 1, '선물로 저격소총 획득');
    ch = await ensureChoice(947, 949, '- (성공) 이얍!', 2);
    await ensureResult(ch, '근력', 1, '팔씨름 승리');
    await ensureResult(ch, '저격소총', 1, '선물로 저격소총 획득');
    ch = await ensureChoice(947, 950, '- (실패) 이얍!', 3);
    await ensureChoice(948, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(949, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(950, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 47. 야바위 (매력)
    await ensureNode(951, '47. 야바위', '세 컵 중 초콜릿 찾기.', 'random');
    await ensureNode(952, '- 첫 번째', '꽝.', 'random');
    await ensureNode(953, '- 두 번째', '거울을 받는다.', 'random');
    await ensureNode(954, '- 세 번째', '꽝.', 'random');
    await ensureChoice(951, 952, '- 첫 번째', 1);
    ch = await ensureChoice(951, 953, '- 두 번째', 2);
    await ensureResult(ch, '매력', 1, '거울로 매력 상승');
    await ensureChoice(951, 954, '- 세 번째', 3);
    await ensureChoice(952, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(953, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(954, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 48. 화장실
    await ensureNode(955, '48. 화장실', '문이 뒤틀린 공중화장실.', 'random');
    await ensureNode(956, '- (근력) 열어 본다.', '시체를 발견한다.', 'random');
    await ensureNode(957, '- 화장실을 지나친다.', '지나친다.', 'random');
    ch = await ensureChoice(955, 956, '- (근력) 열어 본다.', 1, { name: '근력', value: 1 });
    await ensureResult(ch, '정신력', -1, '끔찍한 장면');
    await ensureChoice(955, 957, '- 화장실을 지나친다.', 2);
    await ensureChoice(956, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(957, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 49. 자판기 (물/돈)
    await ensureNode(958, '49. 자판기', '작동할 지도 모르는 자판기.', 'random');
    await ensureNode(959, '- (돈) 돈을 넣는다.', '기계가 켜진다.', 'random');
    await ensureNode(960, '- 돈이 없다. 그냥 가자.', '그냥 간다.', 'random');
    ch = await ensureChoice(958, 959, '- (돈) 돈을 넣는다.', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '자판기 사용');
    await ensureChoice(958, 960, '- 돈이 없다. 그냥 가자.', 2);
    // 하위 세부 선택들
    await ensureNode(961, '- (직감) 이거다!', '생수가 나온다.', 'random');
    await ensureNode(962, '- (근력) 발로 찬다.', '잔돈이 와르르.', 'random');
    await ensureNode(963, '- (성공) 클릭클릭!', '생수가 나온다.', 'random');
    await ensureNode(964, '- (실패) 클릭클릭!', '아무 반응 없음.', 'random');
    ch = await ensureChoice(959, 961, '- (직감) 이거다!', 1, { name: '직감', value: 1 });
    await ensureResult(ch, '물', 1, '생수 획득');
    ch = await ensureChoice(959, 962, '- (근력) 발로 찬다.', 2, { name: '근력', value: 1 });
    await ensureResult(ch, '돈', 2, '잔돈 획득');
    ch = await ensureChoice(959, 963, '- (성공) 클릭클릭!', 3);
    await ensureResult(ch, '물', 1, '생수 획득');
    await ensureChoice(959, 964, '- (실패) 클릭클릭!', 4);
    await ensureChoice(959, GO_ON_NODE, '- 길을 계속 걸어간다', 5);
    await ensureChoice(960, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(961, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(962, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(963, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(964, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 50. 인육 파는 정육점 (식량/돈)
    await ensureNode(965, '50. 인육 파는 정육점', '수상한 정육점.', 'random');
    await ensureNode(966, '- (돈) 하나 주세요.', '찝찝하지만 식량을 얻는다.', 'random');
    await ensureNode(967, '- (직감) 무슨 고기죠? 설마……?', '쫓겨난다.', 'random');
    await ensureNode(968, '- 그냥 정육점을 지나친다.', '지나친다.', 'random');
    ch = await ensureChoice(965, 966, '- (돈) 하나 주세요.', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '고기 구매');
    await ensureResult(ch, '식량', 1, '정체불명 고기');
    await ensureChoice(965, 967, '- (직감) 무슨 고기죠? 설마……?', 2, { name: '직감', value: 1 });
    await ensureChoice(965, 968, '- 그냥 정육점을 지나친다.', 3);
    await ensureChoice(966, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(967, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(968, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    console.log('✅ 랜덤 41~50 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

addRandom41to50();
