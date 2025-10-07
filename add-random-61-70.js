const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandom61to70() {
  console.log('📚 랜덤 스토리 61~70 추가 시작');
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

    // 61. 유튜버… (응급처치)
    await ensureNode(1101, '61. 유튜버…', '인터뷰를 요청하는 소년 유튜버를 만난다.', 'random');
    await ensureNode(1102, '- 안녕하세요 쥐쥐님!', '좋은 걸 알려준다며 응급처치를 가르친다.', 'random');
    await ensureNode(1103, '- 죄송합니다!', '유튜버가 한 마디하고 떠난다.', 'random');
    let ch = await ensureChoice(1101, 1102, '- 안녕하세요 쥐쥐님!', 1);
    await ensureResult(ch, '응급처치', 1, '유튜버에게서 응급처치 기술을 배움');
    await ensureChoice(1101, 1103, '- 죄송합니다!', 2);
    await ensureChoice(1102, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1103, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 62. 사격장 (사격술)
    await ensureNode(1104, '62. 사격장', '총을 소지했다면 연습해보자.', 'random');
    await ensureNode(1105, '- (권총) 사격을 연습한다.', '권총 사격 연습으로 실력이 오른다.', 'random');
    await ensureNode(1106, '- (저격소총) 사격을 연습한다.', '저격소총 사격 연습으로 실력이 오른다.', 'random');
    await ensureNode(1107, '- 그냥 연습하지 않고 간다.', '지나간다.', 'random');
    ch = await ensureChoice(1104, 1105, '- (권총) 사격을 연습한다.', 1, { name: '권총', value: 1 });
    await ensureResult(ch, '사격술', 1, '권총 사격 연습');
    ch = await ensureChoice(1104, 1106, '- (저격소총) 사격을 연습한다.', 2, { name: '저격소총', value: 1 });
    await ensureResult(ch, '사격술', 1, '저격소총 사격 연습');
    await ensureChoice(1104, 1107, '- 그냥 연습하지 않고 간다.', 3);
    await ensureChoice(1105, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1106, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1107, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 63. 토론장 (게임 실력 / 언변술)
    await ensureNode(1108, '63. 토론장', '오이의 맛에 대한 논쟁에 끼어든다.', 'random');
    await ensureNode(1109, '- (언변술) 오이의 맛있음을 철학적으로 널리 알린다.', '사람들이 오이를 찬양한다.', 'random');
    await ensureNode(1110, '- (언변술) 오이의 맛없음을 철학적으로 널리 알린다.', '사람들이 오이를 비난한다.', 'random');
    await ensureNode(1111, '- 되는대로 골라 말한다.', '인생은 게임처럼 선택의 연속.', 'random');
    ch = await ensureChoice(1108, 1109, '- (언변술) 오이의 맛있음을 철학적으로 널리 알린다.', 1, { name: '언변술', value: 1 });
    await ensureResult(ch, '언변술', 1, '설득의 성취');
    ch = await ensureChoice(1108, 1110, '- (언변술) 오이의 맛없음을 철학적으로 널리 알린다.', 2, { name: '언변술', value: 1 });
    await ensureResult(ch, '언변술', 1, '설득의 성취');
    ch = await ensureChoice(1108, 1111, '- 되는대로 골라 말한다.', 3);
    await ensureResult(ch, '게임 실력', 1, '되는대로도 통한다');
    await ensureChoice(1109, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1110, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1111, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 64. 경찰서 (은신술)
    await ensureNode(1112, '64. 경찰서', '털린 경찰서, 혹시 남은 게 있을까?', 'random');
    await ensureNode(1113, '- 경찰서 안을 뒤진다.', '책상 아래로 숨는다. 사실 비둘기였다.', 'random');
    await ensureNode(1114, '- 그냥 뒤지지 않고 간다.', '지나간다.', 'random');
    ch = await ensureChoice(1112, 1113, '- 경찰서 안을 뒤진다.', 1);
    await ensureResult(ch, '은신술', 1, '숨는 법을 익힘');
    await ensureChoice(1112, 1114, '- 그냥 뒤지지 않고 간다.', 2);
    await ensureChoice(1113, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1114, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 65. 경찰서 - 특수 (돈/체력/정신력)
    await ensureNode(1115, '65. 경찰서 - 특수', '경찰들이 김필일을 찾는다.', 'random');
    await ensureNode(1116, '- 그래도 의리가 있지. 모른 척한다.', '경찰이 물러난다. 발치에 현금 다발.', 'random');
    await ensureNode(1117, '- 나부터 살고 봐야지. 위치를 분다.', '수상한 시선이 느껴진다…', 'random');
    await ensureNode(1118, '- 들켰군. 튀자!', '총알이 스친 팔이 화끈거린다.', 'random');
    ch = await ensureChoice(1115, 1116, '- 그래도 의리가 있지. 모른 척한다.', 1);
    await ensureResult(ch, '돈', 3, '뒤탈 없는 현금 다발');
    ch = await ensureChoice(1115, 1117, '- 나부터 살고 봐야지. 위치를 분다.', 2);
    ch = await ensureChoice(1117, 1118, '- 들켰군. 튀자!', 1);
    await ensureResult(ch, '체력', -1, '총알이 스친 상처');
    await ensureResult(ch, '정신력', -1, '쫓기는 공포');
    await ensureChoice(1116, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1118, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 66. 한강 낚시 (식량/물/정신력)
    await ensureNode(1119, '66. 한강 낚시', '무료로 낚시를 해보지 않겠냐는 제안.', 'random');
    await ensureNode(1120, '- (손재주) 낚시해 본다.', '물고기와 엉킨 생수 줄.', 'random');
    await ensureNode(1121, '- (성공) 낚시해 본다.', '물고기와 엉킨 생수 줄.', 'random');
    await ensureNode(1122, '- (실패) 낚시해 본다.', '흉물스러운 쓰레기를 낚았다.', 'random');
    ch = await ensureChoice(1119, 1120, '- (손재주) 낚시해 본다.', 1, { name: '손재주', value: 1 });
    await ensureResult(ch, '식량', 1, '물고기 획득');
    await ensureResult(ch, '물', 1, '밧줄에 엉킨 생수');
    ch = await ensureChoice(1119, 1121, '- (성공) 낚시해 본다.', 2);
    await ensureResult(ch, '식량', 1, '물고기 획득');
    await ensureResult(ch, '물', 1, '밧줄에 엉킨 생수');
    ch = await ensureChoice(1119, 1122, '- (실패) 낚시해 본다.', 3);
    await ensureResult(ch, '정신력', -1, '역겨운 쓰레기');
    await ensureChoice(1120, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1121, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1122, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 67. 학대 당하는 어린애들 (선행/체력)
    await ensureNode(1123, '67. 학대 당하는 어린애들', '아이들을 학대하는 남자를 본다.', 'random');
    await ensureNode(1124, '- (권총) 저런. 당신이 먼저 죽게 생겼군.', '남자를 처단했다.', 'random');
    await ensureNode(1125, '- (저격소총) 저런. 당신이 먼저 죽게 생겼군.', '남자를 처단했다.', 'random');
    await ensureNode(1126, '- 멈춰! 바로 뛰어가 막는다.', '아이들을 감싸며 대신 맞았다.', 'random');
    await ensureNode(1127, '- 나와는 상관없는 일이야. 그냥 지나친다.', '지나간다.', 'random');
    ch = await ensureChoice(1123, 1124, '- (권총) 저런. 당신이 먼저 죽게 생겼군.', 1, { name: '권총', value: 1 });
    await ensureResult(ch, '선행', 1, '아이들을 구함');
    ch = await ensureChoice(1123, 1125, '- (저격소총) 저런. 당신이 먼저 죽게 생겼군.', 2, { name: '저격소총', value: 1 });
    await ensureResult(ch, '선행', 1, '아이들을 구함');
    ch = await ensureChoice(1123, 1126, '- 멈춰! 바로 뛰어가 막는다.', 3);
    await ensureResult(ch, '체력', 1, '대신 맞았다');
    await ensureChoice(1123, 1127, '- 나와는 상관없는 일이야. 그냥 지나친다.', 4);
    await ensureChoice(1124, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1125, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1126, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1127, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 68. 주유소 (기계 공학, 과학 지식)
    await ensureNode(1128, '68. 주유소', '기름 냄새가 진동한다.', 'random');
    await ensureNode(1129, '- 주유소로 다가간다.', '주유 기계는 박살, 바닥은 말라붙은 기름.', 'random');
    await ensureNode(1130, '- 주유소를 둘러본다.', '구석의 오토바이.', 'random');
    await ensureNode(1131, '- 그냥 주유소를 지나친다.', '지나간다.', 'random');
    ch = await ensureChoice(1128, 1129, '- 주유소로 다가간다.', 1);
    ch = await ensureChoice(1129, 1130, '- 주유소를 둘러본다.', 1);
    await ensureResult(ch, '기계 공학', 1, '오토바이 분석');
    await ensureResult(ch, '과학 지식', 1, '연료/기계 이해');
    await ensureChoice(1128, 1131, '- 그냥 주유소를 지나친다.', 2);
    await ensureChoice(1130, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1131, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 69. 불쌍한 미군 (미군과 우호적)
    await ensureNode(1132, '69. 불쌍한 미군', '굶주린 외국인 군인을 발견.', 'random');
    await ensureNode(1133, '- 근원지를 찾아본다.', '골목길 아래에서 남자를 발견.', 'random');
    await ensureNode(1134, '- (물) 군인에게 준다.', '고맙다며 연신 감사 인사.', 'random');
    await ensureNode(1135, '- (식량) 군인에게 준다.', '고맙다며 연신 감사 인사.', 'random');
    await ensureNode(1136, '- 으스스하군. 무시한다.', '지나간다.', 'random');
    ch = await ensureChoice(1132, 1133, '- 근원지를 찾아본다.', 1);
    ch = await ensureChoice(1133, 1134, '- (물) 군인에게 준다.', 1, { name: '물', value: 1 });
    await ensureResult(ch, '물', -1, '물을 건넴');
    await ensureResult(ch, '미군과 우호적', 1, '고마움');
    ch = await ensureChoice(1133, 1135, '- (식량) 군인에게 준다.', 2, { name: '식량', value: 1 });
    await ensureResult(ch, '식량', -1, '식을 건넴');
    await ensureResult(ch, '미군과 우호적', 1, '고마움');
    await ensureChoice(1132, 1136, '- 으스스하군. 무시한다.', 2);
    await ensureChoice(1134, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1135, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1136, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    // 70. 날아다니는 바퀴벌레떼 (손재주/체력)
    await ensureNode(1137, '70. 날아다니는 바퀴벌레떼', '하늘을 덮는 거대한 바퀴벌레들.', 'random');
    await ensureNode(1138, '- (민첩함 Lv.2) 재빠르게 도망간다.', '멋지게 벗어났다. 바닥에 책 한 권.', 'random');
    await ensureNode(1139, '- 벌레 싫어!', '바퀴에게 긁혔다. 바닥에 책 한 권.', 'random');
    ch = await ensureChoice(1137, 1138, '- (민첩함 Lv.2) 재빠르게 도망간다.', 1, { name: '민첩함', value: 2 });
    await ensureResult(ch, '손재주', 1, '도박 관련 책으로 손재주 상승');
    ch = await ensureChoice(1137, 1139, '- 벌레 싫어!', 2);
    await ensureResult(ch, '체력', -1, '긁힌 상처');
    await ensureResult(ch, '손재주', 1, '도박 관련 책으로 손재주 상승');
    await ensureChoice(1138, GO_ON_NODE, '- 길을 계속 걸어간다', 1);
    await ensureChoice(1139, GO_ON_NODE, '- 길을 계속 걸어간다', 1);

    console.log('✅ 랜덤 61~70 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

addRandom61to70();


