const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRandomEvents() {
  try {
    console.log('🔧 랜덤 이벤트 노드들 생성 중...');
    
    // 루트 1의 랜덤 이벤트들 (5개)
    const route1RandomEvents = [
      {
        title: "정보 파는 사람 - 정보요?",
        text: "\"그래, 정보. 너 정말 한국의 정부가 이름표뿐이라 생각하니?\"",
        choices: [
          { label: "그럼 어떤데요?" },
          { label: "무시한다." }
        ]
      },
      {
        title: "정보 파는 사람 - 무시한다",
        text: "\"두고 봐. 무시할 수 없는 정보를 가져올 테니까!\"\n\n여자가 자존심이 상한 표정으로 당신을 바라보다 한 마디를 톡 쏘아붙이고 사라집니다.",
        choices: [
          { label: "계속 나아간다." }
        ]
      },
      {
        title: "무장 강도 - 매력/언변술",
        text: "총을 바닥으로 내린 강도는 이내 울음을 터트립니다. 하는 말을 들어 보니 최근 기승을 부리는 폭주족들이 자신의 애마 바이크를 강탈해갔다는 것 같습니다. 돌려받고 싶다면 돈을 가져오라고 했다는데…… 이것 참. 당신의 일은 아니니 다행입니다.",
        choices: [
          { label: "총을 뺏고 간다." },
          { label: "그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다." }
        ]
      },
      {
        title: "무장 강도 - 랜덤 성공",
        text: "총을 바닥으로 내린 강도는 이내 울음을 터트립니다. 하는 말을 들어 보니 최근 기승을 부리는 폭주족들이 자신의 애마 바이크를 강탈해갔다는 것 같습니다. 돌려받고 싶다면 돈을 가져오라고 했다는데…… 이것 참. 당신의 일은 아니니 다행입니다.",
        choices: [
          { label: "총을 뺏고 간다." },
          { label: "그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다." }
        ]
      },
      {
        title: "무장 강도 - 도망",
        text: "탕! 도망치는 당신을 본 강도가 깜짝 놀라 총을 발포합니다. 총알이 당신의 오른팔을 스치고 지나갑니다. 타들어가는 듯한 작열감이 밀려듭니다. 이런, 젠장…….",
        choices: [
          { label: "저 망할 놈이!" }
        ]
      }
    ];
    
    // 루트 2의 랜덤 이벤트들 (5개)
    const route2RandomEvents = [
      {
        title: "쫓기는 학생 - 숨겨준다",
        text: "남자를 숨겨준 이후, 어디선가 무장한 군인들이 당신에게 가까이 와 묻습니다.\n\n\"혹시 이 정도 체격의 남자를 본 적 없으십니까. 이 근처에서 놓친 것으로 확인되는데…….\"",
        choices: [
          { label: "모르는 사람입니다." },
          { label: "저기 건물에 있어요." }
        ]
      },
      {
        title: "쫓기는 학생 - 무시",
        text: "당신은 그냥 지나갑니다. 남자의 절박한 목소리가 뒤에서 들려오지만, 이런 시대에 누구를 믿을 수 있겠어요?",
        choices: [
          { label: "계속 나아간다." }
        ]
      },
      {
        title: "수상한 테러범 - 은신술 성공",
        text: "당신은 기척을 죽이고 상황을 살핍니다. 어두운 골목에 집중하다 보면, 어디선가 스며든 빛에 모든 광경이 한눈에 들어옵니다. 어떤 남자 앞에서 끔찍한 몰골로 녹아내리고 있는 사람……, 아니. 괴물인가요? 푸른색으로 녹아들어가는 살점이 생생합니다. 그를 차가운 눈으로 내려다 보고 있는 남자는 그 모든 과정을 상세히 관찰하고 있습니다. 그가 중얼거리는 소리가 귓가에 들려옵니다.",
        choices: [
          { label: "숨을 더 죽인다." }
        ]
      },
      {
        title: "수상한 테러범 - 확인 성공",
        text: "당신은 기척을 죽이고 상황을 살핍니다. 어두운 골목에 집중하다 보면, 어디선가 스며든 빛에 모든 광경이 한눈에 들어옵니다. 어떤 남자 앞에서 끔찍한 몰골로 녹아내리고 있는 사람……, 아니. 괴물인가요? 푸른색으로 녹아들어가는 살점이 생생합니다. 그를 차가운 눈으로 내려다 보고 있는 남자는 그 모든 과정을 상세히 관찰하고 있습니다. 그가 중얼거리는 소리가 귓가에 들려옵니다.",
        choices: [
          { label: "숨을 더 죽인다." }
        ]
      },
      {
        title: "수상한 테러범 - 확인 실패",
        text: "당신은 기척을 죽이고 상황을 살핍니다. 어두운 골목에 집중하다 보면, 어디선가 스며든 빛에 모든 광경이 한눈에 들어옵니다. 어떤 남자 앞에서 끔찍한 몰골로 녹아내리고 있는 사람……, 아니. 괴물인가요? 푸른색으로 녹아들어가는 살점이 생생합니다. 그를 차가운 눈으로 내려다 보고 있는 남자는 그 모든 과정을 상세히 관찰하고 있습니다. 그때, 남자가 당신을 눈치챈 것인지 눈을 부라리며 다가옵니다.\n\n\"넌 뭐야?\"",
        choices: [
          { label: "다급히 도망친다." }
        ]
      }
    ];
    
    // 루트 3의 랜덤 이벤트들 (5개)
    const route3RandomEvents = [
      {
        title: "부상 당한 미군 - 괜찮으세요?",
        text: "가까이 다가가자 보이는 사람은 확실히 한국인은 아닌 것 같습니다. 그러고 보면 전쟁 당시 들어와있던 미군은 어느 시점을 이후로 모두 철거했었는데 말이죠. 그날 이후 들어온 연합 단체 소속인 걸까요? 군복 비슷한 옷을 있고 있으나 소속을 특정할 무언가는 보이지 않습니다. 남자는 습격이라도 당한 듯 상태가 좋지 않습니다.",
        choices: [
          { label: "(응급 처치) 치료해준다." },
          { label: "일단 치료해준다. (확률 50%)" },
          { label: "그냥 간다." }
        ]
      },
      {
        title: "부상 당한 미군 - 무시",
        text: "당신은 그냥 지나갑니다. 도움이 필요해 보이지만, 이런 시대에 누구를 믿을 수 있겠어요?",
        choices: [
          { label: "계속 나아간다." }
        ]
      },
      {
        title: "사기꾼 - 뭘 팔면 되죠?",
        text: "마침 당신이 매고 있는 가방은 어떤가요? 어차피 크게 쓸모 있을 것 같진 않습니다!",
        choices: [
          { label: "좋아요!" }
        ]
      },
      {
        title: "사기꾼 - 사기나 칠까",
        text: "텅 빈 가방을 마법의 가방이라고 속여 팔아보는 건 어떨까요? 호구 한 명만 잡으면 꽤나 짭짤할지도 모릅니다.",
        choices: [
          { label: "좋아요!" }
        ]
      },
      {
        title: "사기꾼 - 좋아요!",
        text: "지나가던 사람을 아무나 붙잡아 봅시다. 잘 봐요. 누가 봐도 이게 필요한 사람의 눈빛이라고요.",
        choices: [
          { label: "(언변술) 혹시 필요한 물건이 있지 않으신가요?" },
          { label: "이봐 당신. 물건을 사라.(성공)" },
          { label: "이봐 당신. 물건을 사라.(실패)" }
        ]
      }
    ];
    
    let nodeIdCounter = 12; // 기존 노드들 다음부터 시작
    
    // 루트 1 랜덤 이벤트들 생성
    for (const event of route1RandomEvents) {
      const node = {
        node_id: nodeIdCounter++,
        title: event.title,
        text: event.text,
        node_type: "random_event",
        route_name: "route1_random",
        choices: JSON.stringify(event.choices.map((choice, index) => ({
          id: nodeIdCounter + index,
          targetNodeId: nodeIdCounter + index,
          label: choice.label
        }))),
        rewards: null
      };
      
      await prisma.mainStory.create({ data: node });
    }
    
    // 루트 2 랜덤 이벤트들 생성
    for (const event of route2RandomEvents) {
      const node = {
        node_id: nodeIdCounter++,
        title: event.title,
        text: event.text,
        node_type: "random_event",
        route_name: "route2_random",
        choices: JSON.stringify(event.choices.map((choice, index) => ({
          id: nodeIdCounter + index,
          targetNodeId: nodeIdCounter + index,
          label: choice.label
        }))),
        rewards: null
      };
      
      await prisma.mainStory.create({ data: node });
    }
    
    // 루트 3 랜덤 이벤트들 생성
    for (const event of route3RandomEvents) {
      const node = {
        node_id: nodeIdCounter++,
        title: event.title,
        text: event.text,
        node_type: "random_event",
        route_name: "route3_random",
        choices: JSON.stringify(event.choices.map((choice, index) => ({
          id: nodeIdCounter + index,
          targetNodeId: nodeIdCounter + index,
          label: choice.label
        }))),
        rewards: null
      };
      
      await prisma.mainStory.create({ data: node });
    }
    
    console.log(`\n🎉 랜덤 이벤트 생성 완료!`);
    console.log(`  - 루트 1 랜덤 이벤트: ${route1RandomEvents.length}개`);
    console.log(`  - 루트 2 랜덤 이벤트: ${route2RandomEvents.length}개`);
    console.log(`  - 루트 3 랜덤 이벤트: ${route3RandomEvents.length}개`);
    console.log(`  - 총 생성된 노드: ${nodeIdCounter - 12}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRandomEvents();
