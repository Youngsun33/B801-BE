const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function implementRandomStoryFlow() {
  try {
    console.log('🔧 랜덤 스토리 플로우 구현 중...');
    
    // 기존 랜덤 이벤트들 삭제 (잘못 생성된 것들)
    await prisma.mainStory.deleteMany({
      where: {
        node_type: 'random_event'
      }
    });
    
    console.log('✅ 기존 랜덤 이벤트 삭제 완료');
    
    // 랜덤 스토리 트리거 노드들 생성
    let nodeIdCounter = 12; // 기존 노드들 다음부터 시작
    
    // 체크포인트 2-1 전 랜덤 스토리 트리거
    const randomTrigger1 = {
      node_id: nodeIdCounter++,
      title: "랜덤 스토리 트리거 1",
      text: "길을 걷다 보니 흥미로운 상황이 벌어지고 있습니다...",
      node_type: "random_trigger",
      route_name: "random_trigger_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: randomTrigger1 });
    
    // 체크포인트 3-1 전 랜덤 스토리 트리거
    const randomTrigger2 = {
      node_id: nodeIdCounter++,
      title: "랜덤 스토리 트리거 2",
      text: "계속 길을 걷다 보니 또 다른 흥미로운 상황이 벌어지고 있습니다...",
      node_type: "random_trigger",
      route_name: "random_trigger_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: randomTrigger2 });
    
    // 체크포인트 4-1 전 랜덤 스토리 트리거
    const randomTrigger3 = {
      node_id: nodeIdCounter++,
      title: "랜덤 스토리 트리거 3",
      text: "또 다른 흥미로운 상황이 벌어지고 있습니다...",
      node_type: "random_trigger",
      route_name: "random_trigger_3",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: randomTrigger3 });
    
    // 체크포인트 5-1 전 랜덤 스토리 트리거
    const randomTrigger4 = {
      node_id: nodeIdCounter++,
      title: "랜덤 스토리 트리거 4",
      text: "계속해서 흥미로운 상황들이 벌어지고 있습니다...",
      node_type: "random_trigger",
      route_name: "random_trigger_4",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: randomTrigger4 });
    
    // 체크포인트 6-1 전 랜덤 스토리 트리거
    const randomTrigger5 = {
      node_id: nodeIdCounter++,
      title: "랜덤 스토리 트리거 5",
      text: "마지막으로 흥미로운 상황이 벌어지고 있습니다...",
      node_type: "random_trigger",
      route_name: "random_trigger_5",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: randomTrigger5 });
    
    // 기존 노드들의 선택지를 랜덤 트리거로 연결하도록 업데이트
    // 루트 1-1의 "계속 나아간다" 선택지를 랜덤 트리거 1로 연결
    await prisma.mainStory.update({
      where: { node_id: 3 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter, targetNodeId: 12, label: "정보요?" },
          { id: nodeIdCounter + 1, targetNodeId: 13, label: "무시한다." }
        ])
      }
    });
    
    // 루트 1-2의 "계속 나아간다" 선택지를 랜덤 트리거 1로 연결
    await prisma.mainStory.update({
      where: { node_id: 4 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter + 2, targetNodeId: 14, label: "(매력/언변술) 무슨 일 있으세요?" },
          { id: nodeIdCounter + 3, targetNodeId: 15, label: "무슨 일 있으세요? (랜덤)" },
          { id: nodeIdCounter + 4, targetNodeId: 16, label: "도망친다. (체력-1)" }
        ])
      }
    });
    
    // 루트 2-1의 "계속 나아간다" 선택지를 랜덤 트리거 2로 연결
    await prisma.mainStory.update({
      where: { node_id: 6 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter + 5, targetNodeId: 17, label: "숨겨준다." },
          { id: nodeIdCounter + 6, targetNodeId: 18, label: "무시하고 간다." }
        ])
      }
    });
    
    // 루트 2-2의 "계속 나아간다" 선택지를 랜덤 트리거 2로 연결
    await prisma.mainStory.update({
      where: { node_id: 7 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter + 7, targetNodeId: 19, label: "(은신술) 확인해 본다." },
          { id: nodeIdCounter + 8, targetNodeId: 20, label: "확인해 본다. (확률 50)" },
          { id: nodeIdCounter + 9, targetNodeId: 21, label: "그냥 지나간다." }
        ])
      }
    });
    
    // 루트 3-1의 "계속 나아간다" 선택지를 랜덤 트리거 3으로 연결
    await prisma.mainStory.update({
      where: { node_id: 9 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter + 10, targetNodeId: 22, label: "괜찮으세요?" },
          { id: nodeIdCounter + 11, targetNodeId: 23, label: "무시하고 간다." }
        ])
      }
    });
    
    // 루트 3-2의 "계속 나아간다" 선택지를 랜덤 트리거 3으로 연결
    await prisma.mainStory.update({
      where: { node_id: 10 },
      data: {
        choices: JSON.stringify([
          { id: nodeIdCounter + 12, targetNodeId: 24, label: "음. 뭘 팔면 되죠?" },
          { id: nodeIdCounter + 13, targetNodeId: 25, label: "사기나 칠까……." }
        ])
      }
    });
    
    console.log(`\n🎉 랜덤 스토리 플로우 구현 완료!`);
    console.log(`  - 랜덤 트리거 노드: 5개`);
    console.log(`  - 체크포인트 연결: 완료`);
    console.log(`  - 총 노드 ID: ${nodeIdCounter - 1}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

implementRandomStoryFlow();
