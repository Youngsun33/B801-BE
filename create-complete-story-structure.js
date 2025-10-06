const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCompleteStoryStructure() {
  try {
    console.log('🔧 완전한 스토리 구조 생성 중...');
    
    // 기존 데이터 삭제
    await prisma.choiceRequirement.deleteMany({});
    await prisma.storyChoice.deleteMany({});
    await prisma.mainStory.deleteMany({});
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    let nodeIdCounter = 1;
    
    // 시작 노드
    const startNode = {
      node_id: nodeIdCounter++,
      title: "시작",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "start",
      route_name: "main",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 1" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 2" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "루트 3" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: startNode });
    
    // 루트 1
    const route1Node = {
      node_id: nodeIdCounter++,
      title: "루트 1",
      text: "시작: 두 갈래 길 선택.",
      node_type: "choice",
      route_name: "route1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 1-1. 정보 파는 사람" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 1-2. 무장 강도" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route1Node });
    
    // 루트 1-1. 정보 파는 사람
    const route1_1Node = {
      node_id: nodeIdCounter++,
      title: "정보 파는 사람",
      text: "여자가 정보를 원하냐고 물음.",
      node_type: "story",
      route_name: "route1_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "정보요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route1_1Node });
    
    // 정보요?
    const infoNode = {
      node_id: nodeIdCounter++,
      title: "정보요?",
      text: "여자가 돈을 요구함.",
      node_type: "story",
      route_name: "info",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "[돈] 네……." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "[매력] 그냥 알려주시면 안 돼요?" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "무시한다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: infoNode });
    
    // [돈] 네…….
    const moneyNode = {
      node_id: nodeIdCounter++,
      title: "[돈] 네…….",
      text: "외부 개입(PWK) 정보 일부 획득.",
      node_type: "story",
      route_name: "money",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "그럼 어떤데요?" }
      ]),
      rewards: JSON.stringify({ money: -1 })
    };
    
    await prisma.mainStory.create({ data: moneyNode });
    
    // [매력] 그냥 알려주시면 안 돼요?
    const charmNode = {
      node_id: nodeIdCounter++,
      title: "[매력] 그냥 알려주시면 안 돼요?",
      text: "외부 개입(PWK) 정보 일부 획득.",
      node_type: "story",
      route_name: "charm",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "그럼 어떤데요?" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: charmNode });
    
    // 그게 무슨 말이죠?
    const whatNode = {
      node_id: nodeIdCounter++,
      title: "그게 무슨 말이죠?",
      text: "더 자세한 정보는 태영루 본지부로 오라며 사라짐.",
      node_type: "story",
      route_name: "what",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 나아간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: whatNode });
    
    // 무시한다
    const ignoreNode = {
      node_id: nodeIdCounter++,
      title: "무시한다",
      text: "여자가 자존심 상해하며 사라짐.",
      node_type: "story",
      route_name: "ignore",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 나아간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: ignoreNode });
    
    // 루트 1-2. 무장 강도
    const route1_2Node = {
      node_id: nodeIdCounter++,
      title: "무장 강도",
      text: "강도가 돈을 내놓으라며 울먹임.",
      node_type: "story",
      route_name: "route1_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "[매력/언변술] 무슨 일 있으세요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무슨 일 있으세요? (랜덤)" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "도망친다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route1_2Node });
    
    // [매력/언변술] 무슨 일 있으세요?
    const charmTalkNode = {
      node_id: nodeIdCounter++,
      title: "[매력/언변술] 무슨 일 있으세요?",
      text: "강도의 바이크 강탈 사정을 들음.",
      node_type: "story",
      route_name: "charm_talk",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "총을 뺏고 간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: charmTalkNode });
    
    // 총을 뺏고 간다
    const stealGunNode = {
      node_id: nodeIdCounter++,
      title: "총을 뺏고 간다",
      text: "강도가 울며 도망침.",
      node_type: "story",
      route_name: "steal_gun",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 나아간다." }
      ]),
      rewards: JSON.stringify({ gun: 1, evil: 1 })
    };
    
    await prisma.mainStory.create({ data: stealGunNode });
    
    // 그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다
    const scoldNode = {
      node_id: nodeIdCounter++,
      title: "그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다",
      text: "강도가 울며 도망침.",
      node_type: "story",
      route_name: "scold",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 나아간다." }
      ]),
      rewards: JSON.stringify({ evil: 1 })
    };
    
    await prisma.mainStory.create({ data: scoldNode });
    
    // 체크포인트 2-1 (두 명의 사람)
    const checkpoint2_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 2-1",
      text: "정보 파는 여자와 무장 강도가 동시에 나타나 의뢰함.",
      node_type: "checkpoint",
      route_name: "checkpoint2_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "여자를 따라간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "강도를 따라간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint2_1Node });
    
    // 여자를 따라간다
    const followWomanNode = {
      node_id: nodeIdCounter++,
      title: "여자를 따라간다",
      text: "여자가 여의도 선착장에서 보자고 하고 사라짐.",
      node_type: "story",
      route_name: "follow_woman",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: followWomanNode });
    
    // 강도를 따라간다
    const followRobberNode = {
      node_id: nodeIdCounter++,
      title: "강도를 따라간다",
      text: "강도가 폭주족이 근처에 있다며 도망감.",
      node_type: "story",
      route_name: "follow_robber",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속 간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: followRobberNode });
    
    // 루트 2
    const route2Node = {
      node_id: nodeIdCounter++,
      title: "루트 2",
      text: "시작: 두 갈래 길 선택.",
      node_type: "choice",
      route_name: "route2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 2-1. 쫓기는 학생" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 2-2. 수상한 테러범" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route2Node });
    
    // 루트 2-1. 쫓기는 학생
    const route2_1Node = {
      node_id: nodeIdCounter++,
      title: "쫓기는 학생",
      text: "골목길에서 튀어나온 남자 한 명이 절박하게 당신 팔을 붙잡습니다. 꼭 누군가에게 쫓기기라도 하는 모양새입니다.",
      node_type: "story",
      route_name: "route2_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "숨겨준다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시하고 간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route2_1Node });
    
    // 루트 2-2. 수상한 테러범
    const route2_2Node = {
      node_id: nodeIdCounter++,
      title: "수상한 테러범",
      text: "어두운 골목길을 걸어가던 당신은 한쪽 골목에서 들려오는 끔찍한 비명소리를 듣습니다. 대체 무슨 일이 일어나고 있는 걸까요?",
      node_type: "story",
      route_name: "route2_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "(은신술) 확인해 본다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "확인해 본다. (확률 50)" },
        { id: nodeIdCounter + 2, targetNodeId: nodeIdCounter + 2, label: "그냥 지나간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route2_2Node });
    
    // 루트 3
    const route3Node = {
      node_id: nodeIdCounter++,
      title: "루트 3",
      text: "시작: 두 갈래 길 선택.",
      node_type: "choice",
      route_name: "route3",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 3-1. 부상 당한 미군" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 3-2. 사기꾼" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route3Node });
    
    // 루트 3-1. 부상 당한 미군
    const route3_1Node = {
      node_id: nodeIdCounter++,
      title: "부상 당한 미군",
      text: "\"Help…….\"\n\n금방이라도 꺼질 듯 미약한 목소리입니다. 주변을 둘러보다 보면 어두운 골목길 아래 쓰러져 있는 한 인영이 눈에 들어옵니다.",
      node_type: "story",
      route_name: "route3_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "괜찮으세요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "무시하고 간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: route3_1Node });
    
    // 루트 3-2. 사기꾼
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
    
    await prisma.mainStory.create({ data: route3_2Node });
    
    // 랜덤 트리거 노드들 생성
    const randomTriggers = [
      {
        title: "랜덤 스토리 트리거 1",
        text: "길을 걷다 보니 흥미로운 상황이 벌어지고 있습니다...",
        route_name: "random_trigger_1"
      },
      {
        title: "랜덤 스토리 트리거 2", 
        text: "계속 길을 걷다 보니 또 다른 흥미로운 상황이 벌어지고 있습니다...",
        route_name: "random_trigger_2"
      },
      {
        title: "랜덤 스토리 트리거 3",
        text: "또 다른 흥미로운 상황이 벌어지고 있습니다...",
        route_name: "random_trigger_3"
      },
      {
        title: "랜덤 스토리 트리거 4",
        text: "계속해서 흥미로운 상황들이 벌어지고 있습니다...",
        route_name: "random_trigger_4"
      },
      {
        title: "랜덤 스토리 트리거 5",
        text: "마지막으로 흥미로운 상황이 벌어지고 있습니다...",
        route_name: "random_trigger_5"
      }
    ];
    
    for (const trigger of randomTriggers) {
      const triggerNode = {
        node_id: nodeIdCounter++,
        title: trigger.title,
        text: trigger.text,
        node_type: "random_trigger",
        route_name: trigger.route_name,
        choices: JSON.stringify([
          { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "상황을 확인한다." }
        ]),
        rewards: null
      };
      
      await prisma.mainStory.create({ data: triggerNode });
    }
    
    console.log(`\n🎉 완전한 스토리 구조 생성 완료!`);
    console.log(`  - 생성된 노드: ${nodeIdCounter - 1}개`);
    console.log(`  - 루트 1: 정보 파는 사람 / 무장 강도`);
    console.log(`  - 루트 2: 쫓기는 학생 / 수상한 테러범`);
    console.log(`  - 루트 3: 부상 당한 미군 / 사기꾼`);
    console.log(`  - 랜덤 트리거: 5개`);
    console.log(`  - 체크포인트: 2-1`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteStoryStructure();
