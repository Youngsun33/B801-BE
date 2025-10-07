const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRandomShops() {
  console.log('\n🛒 랜덤 상점 71~80 생성/갱신 시작');
  try {
    // 리소스 맵
    const resources = await prisma.$queryRaw`SELECT id, name, type FROM resources`;
    const nameToId = Object.fromEntries(resources.map(r => [r.name, r.id]));
    const moneyId = nameToId['돈'];
    const ticketId = nameToId['능력 선택권'];
    if (!moneyId || !ticketId) {
      throw new Error('리소스 ID 확인 실패: "돈" 또는 "능력 선택권" 없음');
    }

    // 랜덤 워크 허브 (500)
    const node500 = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id = 1 AND node_id = 500`;
    const to500Id = node500[0]?.id || null;

    // 공통 텍스트 (책 목록 안내는 설명으로만 포함)
    const listText = '[여기는 선택지 말고 밑에 텍스트들 텍스트로만 넣어주면 됨.]\n'
      + '[당신도 할 수 있다 화려한 언어의 마술사!] 언변술 +1\n'
      + '[닌자 석사 과정 밟기] 민첩 +1\n'
      + '[종이접기 기본서] 손재주 +1\n'
      + '[별자리로 운명 찾기♥] 직감 +1\n'
      + '[3초 뚝딱 생명 유지] 응급처치 +1\n'
      + '[기계도 감정이 있다] 기계 공학 +1\n'
      + '[A부터 Z까지 알짜 영어 타파] 영어 +1\n'
      + '[생태 지식 한 권으로 마스터하기] 생태 지식 +1\n'
      + '[쓰레기도 맛있게 만들어주는 요리 비법] 요리 실력 +1\n'
      + '[why? 생명의 신비] 과학 지식 +1\n'
      + '[하루 세 번 나를 가꾸는 뷰티 클래스] 매력 +1\n'
      + '[게임 실력 상위 1%인 내가 알려주는데도 못하겠다고?] 게임 실력 +1\n'
      + '[비둘기보다 조용해지기] 은신술 +1\n'
      + '[사막에서 바늘 찾는 방법 1에 수렴] 관찰력 +1\n'
      + '[권총 마스터하기] 권총 +1\n'
      + '[저격소총 마스터하기] 저격소총 +1\n'
      + '[단 한 방에 날아가는 새를 떨어트리는 법] 사격술 +1\n'
      + '[악인의 마음을 읽는 자들] 악행 +1\n'
      + '[착하게 살아서 나쁠 건 없잖아요?] 선행 +1\n'
      + '[미군의 마음을 사로잡는 AtoZ 데이트 방법] 미군과 우호적 +1\n'
      + '[신앙으로 시작하는 하나님과의 만남] 믿음 +1\n'
      + '[머슬머슬! 쉽게 배우는 근육 키우기] 근력 +1';

    for (let n = 71; n <= 80; n++) {
      const nodeNumber = n; // 실제 노드 번호는 71~80
      const title = `${n}. 랜덤 상점`;
      const text = `"어서옵쇼!!! 없는 것 빼고 다 있습니다!!!"\n\n초록 모포 위 여러 물품들을 올려둔 채 팔고 있는 듯 합니다. 개중 하나가 눈에 들어오네요.\n\n[[- (돈) [능력 선택권]을 산다.]]\n[[- 돈이 어디 있어! 그냥 간다.]]\n\n#- (돈) [능력 선택권]을 산다.\n\n(돈 -1, 능력 선택권 +1)\n\n아래 책 목록 중에 원하는 것을 하나 가져갈 수 있다는군요. (* 총괄계 dm에서 사용 가능합니다.)\n\n${listText}\n\n#- 돈이 어디 있어! 그냥 간다.\n\n[[- 서울을 돌아다닌다.]]`;

      // 노드 생성 또는 갱신
      const found = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id = 1 AND node_id = ${nodeNumber}`;
      let fromNodeId;
      if (found.length === 0) {
        await prisma.$executeRaw`INSERT INTO nodes (story_id, node_id, title, text_content, node_type) VALUES (1, ${nodeNumber}, ${title}, ${text}, 'random_story')`;
        const row = await prisma.$queryRaw`SELECT id FROM nodes WHERE story_id = 1 AND node_id = ${nodeNumber}`;
        fromNodeId = row[0].id;
        console.log(`  ✓ 노드 생성: ${nodeNumber}`);
      } else {
        fromNodeId = found[0].id;
        await prisma.$executeRaw`UPDATE nodes SET title = ${title}, text_content = ${text}, node_type = 'random_story' WHERE id = ${fromNodeId}`;
        console.log(`  ⊙ 노드 갱신: ${nodeNumber}`);
      }

      // 기존 선택지 제거 후 재생성
      await prisma.$executeRaw`DELETE FROM choices WHERE from_node_id = ${fromNodeId}`;

      // 구매 선택지 (자기 자신으로 to_node_id 설정: 구매 후 같은 상점에 머무름)
      await prisma.$executeRaw`INSERT INTO choices (from_node_id, to_node_id, choice_text, order_num) VALUES (${fromNodeId}, ${fromNodeId}, '- (돈) [능력 선택권]을 산다.', 1)`;
      const buyChoice = await prisma.$queryRaw`SELECT id FROM choices WHERE from_node_id = ${fromNodeId} AND choice_text = '- (돈) [능력 선택권]을 산다.'`;
      const buyChoiceId = buyChoice[0].id;

      // 구매 결과: 돈 -1, 능력 선택권 +1
      await prisma.$executeRaw`DELETE FROM choice_results WHERE choice_id = ${buyChoiceId}`;
      await prisma.$executeRaw`INSERT INTO choice_results (choice_id, resource_id, value_change) VALUES (${buyChoiceId}, ${moneyId}, -1)`;
      await prisma.$executeRaw`INSERT INTO choice_results (choice_id, resource_id, value_change) VALUES (${buyChoiceId}, ${ticketId}, 1)`;

      // 그냥 간다 → 랜덤 워크 허브(500) 있으면 500으로, 없으면 자기 자신
      const toId = to500Id || fromNodeId;
      await prisma.$executeRaw`INSERT INTO choices (from_node_id, to_node_id, choice_text, order_num) VALUES (${fromNodeId}, ${toId}, '- 돈이 어디 있어! 그냥 간다.', 2)`;
    }

    console.log('✅ 랜덤 상점 71~80 생성/갱신 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
  } finally {
    await prisma.$disconnect();
  }
}

addRandomShops();
