const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🛠 체크포인트 1 제목/선택지, 노드5 보상 수정 시작');

    // 노드 5 보상 money -> gold 수정
    try {
      await prisma.mainStory.update({
        where: { node_id: 5 },
        data: { rewards: JSON.stringify({ gold: 1 }) }
      });
      console.log('✔ 노드 5 보상 gold:1 로 수정');
    } catch (e) {
      console.log('노드 5 보상 수정 오류:', e.message);
    }

    // 노드 300 보정 (제목/타입)
    await prisma.mainStory.upsert({
      where: { node_id: 300 },
      update: {
        title: '체크포인트 1 (세 갈래 길)',
        node_type: 'checkpoint'
      },
      create: {
        node_id: 300,
        title: '체크포인트 1 (세 갈래 길)',
        text: '길을 나선 당신은 당장 눈앞에 있는 세 갈래 길에 들어섭니다. 왼쪽 길은 우리가 익히 다니던 통로로, 위험한 것은 존재하지 않는다는 걸 알고 있습니다. 가운데 길은…… 어땠었죠? 기억이 잘 나지 않습니다. 다만 오른쪽 길은 확실히 기억나네요. 김필일이 위험하니 가급적 들어서지 말라 당부한 곳이었습니다.',
        node_type: 'checkpoint',
        route_name: '세 갈래 길',
        choices: '[]',
      }
    });
    console.log('✔ 노드 300 제목/타입 보정 완료');

    // 루트 시작 노드 탐색
    const left = await prisma.mainStory.findFirst({ where: { title: { contains: '정보 파는 사람' } }, select: { node_id: true, title: true } });
    const mid = await prisma.mainStory.findFirst({ where: { title: { contains: '쫓기는 학생' } }, select: { node_id: true, title: true } });
    const right = await prisma.mainStory.findFirst({ where: { title: { contains: '부상 당한 미군' } }, select: { node_id: true, title: true } });

    if (!left || !mid || !right) {
      console.log('⚠ 일부 루트 시작 노드를 찾지 못했습니다:', { left, mid, right });
    } else {
      console.log('루트 시작 노드:', { left, mid, right });
    }

    // 노드 300의 StoryChoice 재설정
    await prisma.storyChoice.deleteMany({ where: { story_node_id: 300 } });

    const choices = [];
    if (left) choices.push({ story_node_id: 300, choice_text: '왼쪽 길', target_node_id: left.node_id, order_index: 1, is_available: true });
    if (mid) choices.push({ story_node_id: 300, choice_text: '가운데 길', target_node_id: mid.node_id, order_index: 2, is_available: true });
    if (right) choices.push({ story_node_id: 300, choice_text: '오른쪽 길', target_node_id: right.node_id, order_index: 3, is_available: true });

    if (choices.length) {
      await prisma.storyChoice.createMany({ data: choices });
    }

    // MainStory.choices JSON도 동기화 (클라이언트 구버전 호환)
    const jsonChoices = choices.map((c, i) => ({ id: 1000 + i, targetNodeId: c.target_node_id, label: c.choice_text }));
    await prisma.mainStory.update({ where: { node_id: 300 }, data: { choices: JSON.stringify(jsonChoices) } });

    console.log('✔ 노드 300 선택지 재설정 완료');
    console.log('🎉 작업 완료');
  } catch (e) {
    console.error('❌ 오류:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
