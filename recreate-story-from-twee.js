const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recreateStoryFromTwee() {
  try {
    console.log('🔧 트위인 파일 기반으로 스토리 구조 재생성 중...');
    
    // 기존 데이터 삭제
    await prisma.choiceRequirement.deleteMany({});
    await prisma.storyChoice.deleteMany({});
    await prisma.mainStory.deleteMany({});
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    // 노드 ID 매핑
    const nodeMapping = new Map();
    let nodeIdCounter = 1;
    
    // 시작 노드
    const startNode = {
      node_id: nodeIdCounter++,
      title: "시작",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "start",
      route_name: "main",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "왼쪽 길" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "가운데 길" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "오른쪽 길" }
      ]),
      rewards: null
    };
    
    nodeMapping.set("start", startNode.node_id);
    await prisma.mainStory.create({ data: startNode });
    
    // 루트 1: 정보 파는 사람 / 무장 강도
    const route1Node = {
      node_id: nodeIdCounter++,
      title: "루트 1",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "choice",
      route_name: "route1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 1-1. 정보 파는 사람" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 1-2. 무장 강도" }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route1", route1Node.node_id);
    await prisma.mainStory.create({ data: route1Node });
    
    // 루트 1-1: 정보 파는 사람
    const route1_1Node = {
      node_id: nodeIdCounter++,
      title: "정보 파는 사람",
      text: "어둑한 골목길 안. 멀지 않은 곳에 서있던 여자 한 명이 당신을 주시하고 있습니다. 딱히 적의가 보이지는 않지만…… 경계해서 나쁠 것도 없겠죠. 그때, 그 여자가 당신을 향해 손짓합니다.\n\n\"너도 정보가 필요해서 왔나? 안 그래도 내가 중요한 정보를 입수한 참인데.\"",
      node_type: "story",
      route_name: "route1_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "정보요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시한다." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route1_1", route1_1Node.node_id);
    await prisma.mainStory.create({ data: route1_1Node });
    
    // 루트 1-2: 무장 강도
    const route1_2Node = {
      node_id: nodeIdCounter++,
      title: "무장 강도",
      text: "\"거…… 거기 멈춰! 가진 거 다 내놔!\"\n\n길을 가던 당신의 앞을 막아선 건 무장한 강도입니다. 총구를 겨눈 팔리 사시나무처럼 떨리고 있지만 않았다면 참 무서웠을 텐데 말이에요. 강도는 금방이라도 울 것 같은 얼굴로 돈을 내놓으라 소리치고 있습니다.",
      node_type: "story",
      route_name: "route1_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "(매력/언변술) 무슨 일 있으세요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무슨 일 있으세요? (랜덤)" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "도망친다. (체력-1)" }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route1_2", route1_2Node.node_id);
    await prisma.mainStory.create({ data: route1_2Node });
    
    // 루트 2: 쫓기는 학생 / 수상한 테러범
    const route2Node = {
      node_id: nodeIdCounter++,
      title: "루트 2",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "choice",
      route_name: "route2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 2-1. 쫓기는 학생" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 2-2. 수상한 테러범" }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route2", route2Node.node_id);
    await prisma.mainStory.create({ data: route2Node });
    
    // 루트 2-1: 쫓기는 학생
    const route2_1Node = {
      node_id: nodeIdCounter++,
      title: "쫓기는 학생",
      text: "\"제발 부탁드릴게요. 저 좀 숨겨주세요!\"\n\n골목길에서 튀어나온 남자 한 명이 절박하게 당신 팔을 붙잡습니다. 꼭 누군가에게 쫓기기라도 하는 모양새입니다. 근처에는 아무런 기척도 느껴지지 않는데. 대체 무슨 일일까요. 남자에게 말을 물어보기에는 대답해줄만한 여유가 있어 보이지는 않습니다.",
      node_type: "story",
      route_name: "route2_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "숨겨준다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시하고 간다." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route2_1", route2_1Node.node_id);
    await prisma.mainStory.create({ data: route2_1Node });
    
    // 루트 2-2: 수상한 테러범
    const route2_2Node = {
      node_id: nodeIdCounter++,
      title: "수상한 테러범",
      text: "어두운 골목길을 걸어가던 당신은 한쪽 골목에서 들려오는 끔찍한 비명소리를 듣습니다. 대체 무슨 일이 일어나고 있는 걸까요? 하지만 섣불리 신경을 쓸 수는 없는 노릇입니다. 괜히 선의를 보여 봤자 봉변만 당하기 십상인 게 현실이니까요. 그래도 어떤 상황인지 확인은 해 볼까요?",
      node_type: "story",
      route_name: "route2_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "(은신술) 확인해 본다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "확인해 본다. (확률 50)" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "그냥 지나간다." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route2_2", route2_2Node.node_id);
    await prisma.mainStory.create({ data: route2_2Node });
    
    // 루트 3: 부상 당한 미군 / 사기꾼
    const route3Node = {
      node_id: nodeIdCounter++,
      title: "루트 3",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "choice",
      route_name: "route3",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 3-1. 부상 당한 미군" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 3-2. 사기꾼" }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route3", route3Node.node_id);
    await prisma.mainStory.create({ data: route3Node });
    
    // 루트 3-1: 부상 당한 미군
    const route3_1Node = {
      node_id: nodeIdCounter++,
      title: "부상 당한 미군",
      text: "\"Help…….\"\n\n금방이라도 꺼질 듯 미약한 목소리입니다. 아마 근처에서 들리는 것 같아요. 주변을 둘러보다 보면 어두운 골목길 아래 쓰러져 있는 한 인영이 눈에 들어옵니다.",
      node_type: "story",
      route_name: "route3_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "괜찮으세요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시하고 간다." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route3_1", route3_1Node.node_id);
    await prisma.mainStory.create({ data: route3_1Node });
    
    // 루트 3-2: 사기꾼
    const route3_2Node = {
      node_id: nodeIdCounter++,
      title: "사기꾼",
      text: "매번 사기만 하는 건 아무리 생각해도 손해입니다. 장사는 수완! 그리고 말빨! 이 둘만 있다면 이 세상에 못 팔 건 없을 겁니다. 가방을 열어 봅시다.",
      node_type: "story",
      route_name: "route3_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "음. 뭘 팔면 되죠?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "사기나 칠까……." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("route3_2", route3_2Node.node_id);
    await prisma.mainStory.create({ data: route3_2Node });
    
    // 체크포인트 2-1 (두 명의 사람)
    const checkpoint2_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 2-1",
      text: "영 정신없이 거리를 걸어가던 당신은 어디선가 들려온 목소리에 걸음을 멈춥니다. 가만히 보니 멀리서 두 명의 사람이 당신을 향해 뛰어오고 있습니다. 굉장히 다급해 보입니다.\n\n\"이봐!\" / \"저기요!\"\n\n동시에 당신을 부른 두 사람은…… 응? 어딘가 익숙한 얼굴들입니다. 왼쪽의 여자는 얼마 전 당신에게 정보를 팔았던 사람입니다. 오른쪽의 남자는 바이크를 빼앗겼다는 무장 강도네요. 그들은 각자 자신의 할 말을 떠벌리기 시작합니다.\n\n\"정부 쪽에 관심 있지 않았어? 요즘 여의도 근처에서 흥미로운 말이 돌고 있는데…… 어때? 마침 우리 태영루도 그쪽에 일이 좀 있거든. 당신한테 의뢰를 좀 맡기고 싶어.\"\n\n\"제 바이크를 가져갔다던 그 폭주족들 말이에요, 이 근처에 나타났대요! 제발 같이 가서 제 바이크 좀 되찾아주세요! 이렇게 빌게요…….\"",
      node_type: "checkpoint",
      route_name: "checkpoint2_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "여자를 따라간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "강도를 따라간다." },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "계속 간다." }
      ]),
      rewards: null
    };
    
    nodeMapping.set("checkpoint2_1", checkpoint2_1Node.node_id);
    await prisma.mainStory.create({ data: checkpoint2_1Node });
    
    console.log(`\n🎉 스토리 구조 재생성 완료!`);
    console.log(`  - 생성된 노드: ${nodeIdCounter - 1}개`);
    console.log(`  - 노드 매핑:`, Object.fromEntries(nodeMapping));
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateStoryFromTwee();
