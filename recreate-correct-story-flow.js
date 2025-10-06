const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recreateCorrectStoryFlow() {
  try {
    console.log('🔧 올바른 스토리 플로우 재생성 중...');
    
    // 기존 데이터 삭제
    await prisma.choiceRequirement.deleteMany({});
    await prisma.storyChoice.deleteMany({});
    await prisma.mainStory.deleteMany({});
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    let nodeIdCounter = 1;
    
    // 튜토리얼 노드들 (1-299)
    // 실제로는 튜토리얼 스토리가 있지만, 여기서는 간단히 처리
    const tutorialNode = {
      node_id: nodeIdCounter++,
      title: "튜토리얼",
      text: "튜토리얼을 완료했습니다. 이제 본격적인 스토리가 시작됩니다.",
      node_type: "tutorial",
      route_name: "tutorial",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "계속" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: tutorialNode });
    
    // 노드 300: 세 갈래 길 (체크포인트 2)
    const node300 = {
      node_id: 300, // 명시적으로 300번으로 설정
      title: "루트 1",
      text: "길을 걷던 당신은 눈앞에 또 다시 두 갈래의 길이 펼쳐진 것을 확인합니다. 어느 쪽으로 가는 게 좋을까요?",
      node_type: "checkpoint",
      route_name: "checkpoint2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "루트 1-1. 정보 파는 사람" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "루트 1-2. 무장 강도" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: node300 });
    
    // 루트 1-1. 정보 파는 사람
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
    
    await prisma.mainStory.create({ data: route1_1Node });
    
    // 정보요?
    const infoNode = {
      node_id: nodeIdCounter++,
      title: "정보요?",
      text: "\"그래, 정보. 너 정말 한국의 정부가 이름표뿐이라 생각하니?\"",
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
      text: "\"그래, 뭐든 돈이 있어야 원하는 걸 얻을 수 있는 법이란다.\"\n\n여자의 입꼬리가 아주 자유분방합니다. 그녀는 짐짓 심각한 표정을 지으며 말을 이어갑니다.\n\n\"대한민국이 이렇게 된 이후로 모두들 정부가 자멸했다고 알고 있지만, 사실 외부의 개입이 있었다는 말이 있어. 아마 외부 세력이 아닐까? 그전에는 다른 나라들 소식을 접할 데가 없어서 지구 전체가 비슷한 상황이라는 말을 모두들 믿었지만 지금은 아니야. 아마 상황이 이렇게까지 안 좋은 건 우리뿐일지도 몰라.\"",
      node_type: "story",
      route_name: "money",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "그게 무슨 말이죠?" }
      ]),
      rewards: JSON.stringify({ money: -1 })
    };
    
    await prisma.mainStory.create({ data: moneyNode });
    
    // [매력] 그냥 알려주시면 안 돼요?
    const charmNode = {
      node_id: nodeIdCounter++,
      title: "[매력] 그냥 알려주시면 안 돼요?",
      text: "\"크흠……. 아 정말 안 되는데.\"\n\n그런 것치고는 여자의 입꼬리가 아주 자유분방합니다. 그녀는 선심 쓴다는 듯 말을 이어갑니다.\n\n\"대한민국이 이렇게 된 이후로 모두들 정부가 자멸했다고 알고 있지만, 사실 외부의 개입이 있었다는 말이 있어. 아마 외부 세력이 아닐까? 그전에는 다른 나라들 소식을 접할 데가 없어서 지구 전체가 비슷한 상황이라는 말을 모두들 믿었지만 지금은 아니야. 아마 상황이 이렇게까지 안 좋은 건 우리뿐일지도 몰라.\"",
      node_type: "story",
      route_name: "charm",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "그게 무슨 말이죠?" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: charmNode });
    
    // 그게 무슨 말이죠?
    const whatNode = {
      node_id: nodeIdCounter++,
      title: "그게 무슨 말이죠?",
      text: "\"내가 줄 수 있는 정보는 여기까지야. 더 정보가 필요하면 우리 태영루 본지부로 오라고!\"\n\n여자가 얄밉게 손을 흔들며 유유히 사라집니다.",
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
      text: "\"두고 봐. 무시할 수 없는 정보를 가져올 테니까!\"\n\n여자가 자존심이 상한 표정으로 당신을 바라보다 한 마디를 톡 쏘아붙이고 사라집니다.",
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
      text: "\"거…… 거기 멈춰! 가진 거 다 내놔!\"\n\n길을 가던 당신의 앞을 막아선 건 무장한 강도입니다. 총구를 겨눈 팔리 사시나무처럼 떨리고 있지만 않았다면 참 무서웠을 텐데 말이에요. 강도는 금방이라도 울 것 같은 얼굴로 돈을 내놓으라 소리치고 있습니다.",
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
      text: "총을 바닥으로 내린 강도는 이내 울음을 터트립니다. 하는 말을 들어 보니 최근 기승을 부리는 폭주족들이 자신의 애마 바이크를 강탈해갔다는 것 같습니다. 돌려받고 싶다면 돈을 가져오라고 했다는데…… 이것 참. 당신의 일은 아니니 다행입니다.",
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
      text: "총을 뺏긴 강도가 엉엉 울면서 사라집니다. 휴! 오늘도 착한 일을 했어요. 나한테만 착한 일이면 착한 일이죠. 안 그래요?",
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
      text: "총을 뺏긴 강도가 엉엉 울면서 사라집니다. 휴! 오늘도 착한 일을 했어요. 나한테만 착한 일이면 착한 일이죠. 안 그래요?",
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
      text: "영 정신없이 거리를 걸어가던 당신은 어디선가 들려온 목소리에 걸음을 멈춥니다. 가만히 보니 멀리서 두 명의 사람이 당신을 향해 뛰어오고 있습니다. 굉장히 다급해 보입니다.\n\n\"이봐!\" / \"저기요!\"\n\n동시에 당신을 부른 두 사람은…… 응? 어딘가 익숙한 얼굴들입니다. 왼쪽의 여자는 얼마 전 당신에게 정보를 팔았던 사람입니다. 오른쪽의 남자는 바이크를 빼앗겼다는 무장 강도네요. 그들은 각자 자신의 할 말을 떠벌리기 시작합니다.\n\n\"정부 쪽에 관심 있지 않았어? 요즘 여의도 근처에서 흥미로운 말이 돌고 있는데…… 어때? 마침 우리 태영루도 그쪽에 일이 좀 있거든. 당신한테 의뢰를 좀 맡기고 싶어.\"\n\n\"제 바이크를 가져갔다던 그 폭주족들 말이에요, 이 근처에 나타났대요! 제발 같이 가서 제 바이크 좀 되찾아주세요! 이렇게 빌게요…….\"",
      node_type: "checkpoint",
      route_name: "checkpoint2_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "여자를 따라간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "강도를 따라간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint2_1Node });
    
    // 랜덤 트리거 노드들 생성 (체크포인트 전)
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
    
    console.log(`\n🎉 올바른 스토리 플로우 생성 완료!`);
    console.log(`  - 튜토리얼: 노드 1`);
    console.log(`  - 세 갈래 길: 노드 300 (체크포인트 2)`);
    console.log(`  - 루트 1-1: 정보 파는 사람`);
    console.log(`  - 루트 1-2: 무장 강도`);
    console.log(`  - 체크포인트 2-1: 두 명의 사람`);
    console.log(`  - 랜덤 트리거: 5개`);
    console.log(`  - 총 노드: ${nodeIdCounter - 1}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateCorrectStoryFlow();
