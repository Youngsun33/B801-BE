const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCheckpoints() {
  try {
    console.log('🔧 체크포인트 노드들 생성 중...');
    
    let nodeIdCounter = 27; // 기존 노드들 다음부터 시작
    
    // 체크포인트 3-1 (두 개의 아르바이트)
    const checkpoint3_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 3-1",
      text: "길을 걸어가던 당신의 앞에 보이는 건 골목길에 붙여진 아르바이트 구인 공고입니다. 다른 것들은 모두 뜯어가고 없는 것 같은데, 이 두 개는 아주 멀쩡해 보이네요. 아무도 건들지 않을 만큼 별로라는 말인가요? 그런 것치고는 시급도 짭짤한데…… 각각의 공고에는 하기 내용들이 적혀있습니다.\n\n[일일 아르바이트 구합니다.\n\n귀여운 아이들과 놀아주실 천사 분을 찾습니다. 아이들과 함께 책을 읽으며 지식을 나눠봐요.\n\n근무지: 용산구 xxxx……]\n\n[아르바이트 구인 공고\n\n임상시험 하실 분 구합니다.\n\n목숨 보장은 못 해드리지만 인생은 바꿔드릴 수 있습니다.\n\n근무지: 강서구 xxx……]",
      node_type: "checkpoint",
      route_name: "checkpoint3_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "첫 번째 공고를 찾아간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "두 번째 공고를 찾아간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint3_1Node });
    
    // 체크포인트 4-1 (두 개의 현상수배지)
    const checkpoint4_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 4-1",
      text: "길을 걸어가던 당신의 앞에 보이는 건 골목길에 붙여진 현상수배지입니다. 다른 것들은 모두 뜯어가고 없는 것 같은데, 이 두 개는 아주 멀쩡해 보이네요. 아무도 건들지 않을 만큼 위험한 놈들이라는 말인가요? 각각의 현상수배지에는 하기 내용들이 적혀있습니다.\n\n[최창식 (37)\n\n중요 물건을 탈취 후 잠적함.\n소재지 불명.\n발견 시 하단에 기재된 주소로 신고 요망.\n\n수배금 xxxx……]\n\n[김은수 (22)\n\n교회 내 석상 파괴 후 도주.\n소재지 불명.\n발견 시 하단에 기재된 주소로 신고 요망.\n\n수배금 xxxx……]",
      node_type: "checkpoint",
      route_name: "checkpoint4_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "첫 번째 수배지를 챙긴다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "두 번째 수배지를 챙긴다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint4_1Node });
    
    // 체크포인트 5-1 (태영루)
    const checkpoint5_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 5-1",
      text: "정신없이 돌아다니다 보니 어느덧 여자가 얘기했던 여의도 선착장입니다. 비릿한 물 냄새가 풍기고, 여자를 찾아 두리번거리던 때. 누군가 당신의 어깨를 두드립니다.\n\n뭐야?\n\n\"이 씨 소개로 왔지? 바빠서 먼저 여의도로 들어가 있을 테니 배 타고 들어오라더라.\"\n\n말을 전한 남자는 볼일이 끝났다는 듯 사라집니다. 굳이 멀리 가지 않아도 눈앞에 있는 선착장에서 배를 타고 여의도로 넘어갈 수 있을 것 같습니다. 선착장 가까이 가자 배를 모는 사람으로 보이는 남자가 다가옵니다.\n\n\"형 씨, 배 탈 거야? 우리 배는 그냥 돈만 있다고 탈 수 있는 게 아닌데. 특별한 기술이 있어야 된다고.\"",
      node_type: "checkpoint",
      route_name: "checkpoint5_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "(손재주 Lv.2) 지금 제 앞에서 기술이라고 했습니까?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "조금 더 수련하고 오겠습니다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint5_1Node });
    
    // 체크포인트 5-2 (도박장)
    const checkpoint5_2Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 5-2",
      text: "정처 없이 여의도 일대를 떠돌던 당신은 마침내 사람들이 이야기 하는 도박장을 찾을 수 있었습니다. 대체 여의도 안에 도박장이 왜 생긴 건지 알 수 없어도, 생각보다 굉장히 화려합니다. 이런 서울에서 찾아보기 힘들 정도로요. 저 귀한 전기를 저렇게나 써대다니…….",
      node_type: "checkpoint",
      route_name: "checkpoint5_2",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "들어간다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "돌아간다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint5_2Node });
    
    // 체크포인트 5-3 (태영루 지부)
    const checkpoint5_3Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 5-3",
      text: "태영루 영등포 지부. 아마 이곳이 본 지부인 듯 내부에는 사람들이 바쁘게 돌아다닙니다. 입구에서 카드를 가지고 장난질을 치고 있던 익숙한 여자가 당신을 알아보고는 가까이 다가옵니다.\n\n\"오! 아주 화려하게 일을 성공했나 보던데. 일대에서 네 소문이 자자해. 금고 위치를 아는 사람이라고. 제법…… 위험해졌겠다.\"\n\n양심은 어디 팔아치운 건지…… 보상을 두둑하게 챙겨주지 않으면 깽판이라도 치고 싶은 심정입니다. 여자는 당신의 상태를 알아챈 듯 금세 방으로 안내합니다. 유독 화려해 보이는 방 안에는 중년의 여성이 당신을 기다리고 있습니다. 단번에 봐도 알 수 있을 정도의 풍채입니다. 아마 이 정보 길드의 수장이겠죠.\n\n\"그래. 당신이 아주 귀한 정보를 가져왔다던데.\"",
      node_type: "checkpoint",
      route_name: "checkpoint5_3",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "금고 위치를 말해 준다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint5_3Node });
    
    // 체크포인트 5-4 (도봉구)
    const checkpoint5_4Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 5-4",
      text: "당신은 태영루의 보스가 알려준 곳으로 향합니다. 도봉구. 서울의 가장 북쪽에 있어 경기도를 통해 북한으로까지 넘어갈 수 있을지 모릅니다. 어느새 도착한 도봉구는 뭔가 굉장히 조용합니다. 사람이 거의 살지 않는 것처럼요.\n\n당신은 보스가 알려줬던 지도를 잘 생각해내며 계속해서 앞으로 나아갑니다. 그렇게 한참을 걸었을까. 다리가 슬슬 아파올 즈음. 서울 바깥으로 향하는 터널이 눈앞에 나타납니다.\n\n당신이 한참 근처에서 고민하고 있을 때. 피난민처럼 온갖 짐을 챙긴 가족처럼 보이는 사람들이 가까이 다가옵니다. 저 사람들도 서울을 빠져나가려는 걸까요?",
      node_type: "checkpoint",
      route_name: "checkpoint5_4",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "저기요." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "그냥 지켜본다." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint5_4Node });
    
    // 체크포인트 6-1 (폭주족)
    const checkpoint6_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 6-1",
      text: "빠라바라바라밤! 고즈넉한 서울 거리에 요란한 경적 소리가 울려 퍼집니다. 그 순간 당신 뒤로 번쩍거리는 불빛들. 뒤를 돌면 맹렬한 기세로 당신에게 달려드는 폭주족들이 보입니다. 깡, 깡, 깡. 손에 든 쇠파이프가 바닥과 부딪힐 때마다 작은 스파크를 튀기며 소름 돋는 소리를 내지릅니다.\n\n\"어이, 네가 우리를 보고 싶어한다는 놈이냐?\"\n\n우두머리에 있는 가죽 자켓의 남자가 흉흉한 기색으로 당신을 노려봅니다.",
      node_type: "checkpoint",
      route_name: "checkpoint6_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "(매력 Lv.2) 저도 폭주족이 되고 싶습니다." },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "조금만 기다리세요. 당신은 곧 내 남자가 될 거니까." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint6_1Node });
    
    // 체크포인트 7-1 (게임 실력)
    const checkpoint7_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 7-1",
      text: "화려한 게임 실력을 본 아이들이 당신 주변으로 몰려듭니다. 당장 놀아달라는 듯 바지자락을 끌어당기는 손길이 귀엽기만 합니다. 이를 흐뭇하게 바라보던 여성이 아이들을 잘 부탁한다는 말을 남기고 몇 명의 인원과 함께 밖으로 나섭니다. 이제 아이들을 놀아줘볼까요?",
      node_type: "checkpoint",
      route_name: "checkpoint7_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "정석적인 보드게임!" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "재미있는 카드게임!" }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint7_1Node });
    
    // 체크포인트 8-1 (기계 공학)
    const checkpoint8_1Node = {
      node_id: nodeIdCounter++,
      title: "체크포인트 8-1",
      text: "\"이 자식. 보기보다 기계를 다룰 줄 아는 놈이었구먼?\"\n\n당신에게 아니꼽게 바라보던 시선은 온데간데 없습니다. 굉장히 호의적인 눈빛으로 당신을 바라보던 중년 남성이 손을 내밉니다.\n\n\"내 이름은 장호걸일세. 여기 동수 산업의 총괄을 맡고 있지. 아무튼. 아르바이트를 하고 싶다고?\"",
      node_type: "checkpoint",
      route_name: "checkpoint8_1",
      choices: JSON.stringify([
        { id: nodeIdCounter, targetNodeId: nodeIdCounter, label: "그런데 여기 임상시험 아르바이트 아닌가요?" },
        { id: nodeIdCounter + 1, targetNodeId: nodeIdCounter + 1, label: "아니요. 사실 잘못 왔어요." }
      ]),
      rewards: null
    };
    
    await prisma.mainStory.create({ data: checkpoint8_1Node });
    
    console.log(`\n🎉 체크포인트 생성 완료!`);
    console.log(`  - 생성된 체크포인트: 9개`);
    console.log(`  - 총 노드 ID: ${nodeIdCounter - 1}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCheckpoints();
