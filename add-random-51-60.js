const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandom51to60() {
  console.log('📚 랜덤 스토리 51~60 추가 시작');
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

    // 51. 황산 테러하는 인간
    await ensureNode(971, '51. 황산 테러하는 인간', '발등에 산성 물질이 떨어진다.', 'random');
    await ensureNode(972, '- (민첩함) 쫓아간다.', '범인을 잡아 돈을 털어먹는다.', 'random');
    await ensureNode(973, '- 괘씸하지만 그냥 간다.', '그냥 지나친다.', 'random');
    let ch = await ensureChoice(971, 972, '- (민첩함) 쫓아간다.', 1, { name: '민첩함', value: 1 });
    await ensureResult(ch, '체력', -1, '산성 물질 피해');
    await ensureResult(ch, '돈', 1, '범인을 잡아 돈 획득');
    await ensureResult(ch, '악행', 1, '가혹한 응징');
    ch = await ensureChoice(971, 973, '- 괘씸하지만 그냥 간다.', 2);
    await ensureResult(ch, '체력', -1, '산성 물질 피해');
    await ensureChoice(972, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(973, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 52. 수상한 리어카
    await ensureNode(974, '52. 수상한 리어카', '오르막을 오르던 리어카에서 무언가 떨어졌다.', 'random');
    await ensureNode(975, '- 종이를 펼친다.', '종이 속에는 사람의 팔이 있었다.', 'random');
    await ensureNode(976, '- 바로 가져다 준다.', '의심스럽게 바라보더니 감사 인사를 전한다.', 'random');
    await ensureNode(977, '- 그냥 못 본 척하고 간다.', '그냥 지나친다.', 'random');
    ch = await ensureChoice(974, 975, '- 종이를 펼친다.', 1);
    await ensureResult(ch, '정신력', -1, '끔찍한 광경');
    ch = await ensureChoice(974, 976, '- 바로 가져다 준다.', 2);
    await ensureResult(ch, '선행', 1, '잃어버린 물건 전달');
    await ensureChoice(974, 977, '- 그냥 못 본 척하고 간다.', 3);
    await ensureChoice(975, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(976, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(977, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 53. 나는 슬플때 춤을 춰
    await ensureNode(978, '53. 나는 슬플때 춤을 춰', '기괴한 EDM에 맞춰 춤을 추는 남자.', 'random');
    await ensureNode(979, '- 좋아요!', '함께 춤을 춘다.', 'random');
    await ensureNode(980, '- (언변술) 멈춤도 춤이다.', '말로 감동시켜 멈추게 한다.', 'random');
    ch = await ensureChoice(978, 979, '- 좋아요!', 1);
    await ensureResult(ch, '정신력', 1, '춤으로 기분 전환');
    await ensureResult(ch, '손재주', 1, '리듬감 상승');
    ch = await ensureChoice(978, 980, '- (언변술) 멈춤도 춤이다.', 2, { name: '언변술', value: 1 });
    await ensureResult(ch, '정신력', 1, '설득의 성취감');
    await ensureResult(ch, '손재주', 1, '리듬감 상승');
    await ensureChoice(979, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(980, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 54. 노래하는 여자
    await ensureNode(981, '54. 노래하는 여자', '헤드셋을 끼고 노래하는 여자.', 'random');
    await ensureNode(982, '- 팝송을 부른다.', '같이 노래하고 헤드셋을 건네받는다.', 'random');
    await ensureNode(983, '- K-POP을 부른다.', '같이 노래하고 헤드셋을 건네받는다.', 'random');
    ch = await ensureChoice(981, 982, '- 팝송을 부른다.', 1);
    await ensureResult(ch, '정신력', 1, '음악의 치유');
    await ensureResult(ch, '믿음', 1, '음악에 대한 믿음');
    ch = await ensureChoice(981, 983, '- K-POP을 부른다.', 2);
    await ensureResult(ch, '정신력', 1, '음악의 치유');
    await ensureResult(ch, '믿음', 1, '음악에 대한 믿음');
    await ensureChoice(982, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(983, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 55. 죽어가는 남자
    await ensureNode(984, '55. 죽어가는 남자', '굶주린 남자가 도움을 청한다.', 'random');
    await ensureNode(985, '- (물) 건넨다.', '남자가 되살아난 듯 고마워한다.', 'random');
    await ensureNode(986, '- (식량) 건넨다.', '남자가 되살아난 듯 고마워한다.', 'random');
    await ensureNode(987, '- 그냥 가방이나 뒤진다.', '가방에서 여러 물건을 챙긴다.', 'random');
    ch = await ensureChoice(984, 985, '- (물) 건넨다.', 1, { name: '물', value: 1 });
    await ensureResult(ch, '물', -1, '물을 건넴');
    await ensureResult(ch, '선행', 1, '사람을 도왔다');
    await ensureResult(ch, '미군과 우호적', 1, '책을 받음');
    ch = await ensureChoice(984, 986, '- (식량) 건넨다.', 2, { name: '식량', value: 1 });
    await ensureResult(ch, '식량', -1, '식량을 건넴');
    await ensureResult(ch, '선행', 1, '사람을 도왔다');
    await ensureResult(ch, '미군과 우호적', 1, '책을 받음');
    ch = await ensureChoice(984, 987, '- 그냥 가방이나 뒤진다.', 3);
    await ensureResult(ch, '악행', 1, '죽어가는 이를 약탈');
    await ensureResult(ch, '돈', 1, '현금을 챙김');
    await ensureResult(ch, '미군과 우호적', 1, '책을 챙김');
    await ensureChoice(985, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(986, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(987, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 56. 점성술사
    await ensureNode(988, '56. 점성술사', '수정구로 미래를 본다는 점성술사.', 'random');
    await ensureNode(989, '- (돈) 당장 주세요.', '팔찌를 구매했다.', 'random');
    await ensureNode(990, '- 정확히 말해 주세요.', '사람을 조심하라는 조언.', 'random');
    await ensureNode(991, '- (돈) 팔찌 주세요!', '팔찌를 구매했다.', 'random');
    await ensureNode(992, '- 이런 건 다 가짜야. 그냥 간다.', '그냥 지나간다.', 'random');
    ch = await ensureChoice(988, 989, '- (돈) 당장 주세요.', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '팔찌 구매');
    await ensureResult(ch, '매력', 1, '반짝이는 팔찌');
    await ensureResult(ch, '직감', 1, '액운을 물리친다 믿음');
    ch = await ensureChoice(988, 990, '- 정확히 말해 주세요.', 2);
    ch = await ensureChoice(990, 991, '- (돈) 팔찌 주세요!', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '팔찌 구매');
    await ensureResult(ch, '매력', 1, '반짝이는 팔찌');
    await ensureResult(ch, '직감', 1, '액운을 물리친다 믿음');
    await ensureChoice(988, 992, '- 이런 건 다 가짜야. 그냥 간다.', 3);
    await ensureChoice(989, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(991, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(992, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 57. 알코올 중독자
    await ensureNode(993, '57. 알코올 중독자', '술에 취한 남자가 무엇인가를 요구한다.', 'random');
    await ensureNode(994, '- (물) 이거라도 드릴까요?', '고맙다며 좋아한다.', 'random');
    await ensureNode(995, '- (돈) 다른 건 있어요.', '고맙다며 좋아한다.', 'random');
    await ensureNode(996, '- (근력) 제가 그 병을 고칠 줄 아는데…….', '겁먹고 돈을 바친다.', 'random');
    await ensureNode(997, '- (권총) 제가 그 병을 고칠 줄 아는데…….', '겁먹고 돈을 바친다.', 'random');
    await ensureNode(998, '- 엮여서 좋을 게 없다. 무시하고 지나간다.', '그냥 지나간다.', 'random');
    ch = await ensureChoice(993, 994, '- (물) 이거라도 드릴까요?', 1, { name: '물', value: 1 });
    await ensureResult(ch, '물', -1, '물을 건넴');
    await ensureResult(ch, '선행', 1, '도움을 줌');
    ch = await ensureChoice(993, 995, '- (돈) 다른 건 있어요.', 2, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '돈을 건넴');
    await ensureResult(ch, '선행', 1, '도움을 줌');
    ch = await ensureChoice(993, 996, '- (근력) 제가 그 병을 고칠 줄 아는데…….', 3, { name: '근력', value: 1 });
    await ensureResult(ch, '돈', 1, '겁주고 돈을 뜯음');
    await ensureResult(ch, '악행', 1, '폭력적인 위협');
    ch = await ensureChoice(993, 997, '- (권총) 제가 그 병을 고칠 줄 아는데…….', 4, { name: '권총', value: 1 });
    await ensureResult(ch, '돈', 1, '겁주고 돈을 뜯음');
    await ensureResult(ch, '악행', 1, '무력 시위');
    await ensureChoice(993, 998, '- 엮여서 좋을 게 없다. 무시하고 지나간다.', 5);
    await ensureChoice(994, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(995, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(996, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(997, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(998, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 58. 권총 테러
    await ensureNode(999, '58. 권총 테러', '총알이 스쳐 지나간다.', 'random');
    await ensureNode(1000, '- (권총) 본때를 보여주지!', '상대가 성경 한 권을 건네고 사라진다.', 'random');
    await ensureNode(1001, '- (사격술) 본때를 보여주지!', '상대가 성경 한 권을 건네고 사라진다.', 'random');
    await ensureNode(1002, '- (저격소총) 본때를 보여주지!', '상대가 성경 한 권을 건네고 사라진다.', 'random');
    await ensureNode(1003, '- 총이다! 도망친다.', '팔을 스치고 지나갔다.', 'random');
    ch = await ensureChoice(999, 1000, '- (권총) 본때를 보여주지!', 1, { name: '권총', value: 1 });
    await ensureResult(ch, '믿음', 1, '수상한 로브의 인물에게서 성경을 받음');
    ch = await ensureChoice(999, 1001, '- (사격술) 본때를 보여주지!', 2, { name: '사격술', value: 1 });
    await ensureResult(ch, '믿음', 1, '수상한 로브의 인물에게서 성경을 받음');
    ch = await ensureChoice(999, 1002, '- (저격소총) 본때를 보여주지!', 3, { name: '저격소총', value: 1 });
    await ensureResult(ch, '믿음', 1, '수상한 로브의 인물에게서 성경을 받음');
    ch = await ensureChoice(999, 1003, '- 총이다! 도망친다.', 4);
    await ensureResult(ch, '체력', -1, '총알이 스쳐 지나감');
    await ensureChoice(1000, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1001, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1002, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1003, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 59. 투봇장
    await ensureNode(1004, '59. 투봇장', '로봇 싸움 내기.', 'random');
    await ensureNode(1005, '- (성공) (돈) 돈을 건다.', '배당에서 이겼다!', 'random');
    await ensureNode(1006, '- (실패) (돈) 돈을 건다.', '돈만 날렸다.', 'random');
    await ensureNode(1007, '- 알 바 없다. 무시한다.', '그냥 지나간다.', 'random');
    ch = await ensureChoice(1004, 1005, '- (성공) (돈) 돈을 건다.', 1, { name: '돈', value: 1 });
    await ensureResult(ch, '직감', 1, '감이 맞아떨어짐');
    await ensureResult(ch, '은신술', 1, '북적임 속에서 움직임을 숨김');
    await ensureResult(ch, '손재주', 1, '은근한 손놀림');
    await ensureResult(ch, '돈', 1, '배당 승리');
    ch = await ensureChoice(1004, 1006, '- (실패) (돈) 돈을 건다.', 2, { name: '돈', value: 1 });
    await ensureResult(ch, '돈', -1, '내기에서 짐');
    await ensureChoice(1004, 1007, '- 알 바 없다. 무시한다.', 3);
    await ensureChoice(1005, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1006, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1007, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 60. 시체에 불지르며 기도하는 사람들
    await ensureNode(1008, '60. 시체에 불지르며 기도하는 사람들', '화형 장면을 목격했다.', 'random');
    await ensureNode(1009, '- (민첩함) 도망간다.', '겨우 벗어났다.', 'random');
    await ensureNode(1010, '- 젠장! 도망간다.', '붙들려 설교를 듣게 됐다.', 'random');
    await ensureNode(1011, '- 자리에서 빠져나간다.', '재빨리 빠져나간다.', 'random');
    ch = await ensureChoice(1008, 1009, '- (민첩함) 도망간다.', 1, { name: '민첩함', value: 1 });
    await ensureResult(ch, '민첩함', 1, '재빨리 현장을 이탈');
    await ensureResult(ch, '정신력', 1, '끔찍한 장면에서 벗어남');
    ch = await ensureChoice(1008, 1010, '- 젠장! 도망간다.', 2);
    await ensureResult(ch, '믿음', 1, '강제 설교로 믿음 증가');
    await ensureResult(ch, '정신력', -1, '광기 어린 설교에 지침');
    await ensureChoice(1008, 1011, '- 자리에서 빠져나간다.', 3);
    await ensureChoice(1009, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1010, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1011, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    console.log('✅ 랜덤 51~60 (리팩터링) 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

addRandom51to60();
