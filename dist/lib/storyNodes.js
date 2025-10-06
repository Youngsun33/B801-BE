"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUTORIAL_NODES = exports.INTRO_NODES = exports.CHECKPOINT_NODES = exports.MAIN_STORY_POOL = exports.RANDOM_STORY_POOL = exports.CHOICE_TO_NODE = exports.STORY_NODES = void 0;
exports.STORY_NODES = {
    100: {
        nodeId: 100,
        text: "핵 전쟁으로 황폐화된 서울. 하지만 아직까지 이 땅에는 자리를 잡고 살아가는 무리들이 있습니다.\n\n그건 당신에게도 해당되는 말이었죠. 우리는 김필일 필두로 모여 하나의 집단을 형성했습니다.",
        choices: [
            { id: 100, label: "핵 전쟁에 대해 더 자세히 알고 싶습니다." },
            { id: 101, label: "이미 알고 있는 이야기니 빠르게 갑시다." }
        ],
        nodeType: 'intro'
    },
    101: {
        nodeId: 101,
        text: "핵 전쟁이 발발한지는 어언 3년 전. 계기야 으레 전쟁들이 그렇듯 오랫동안 묵힌 여러 감정들이었습니다. 지금에서는 별로 중요하지 않은 일이니 잠시 넘어갈까요. 우리는 모종의 이유로 혼자가 되었습니다. 전쟁 전부터 혼자였을지도 모르겠지만요.\n\n다행인 건 핵폭탄이 터진 상공이 서울은 아니었다는 겁니다. 꽤나 먼 거리에서 터진 폭탄으로도 이렇게 황폐화가 되었는데, 터진 자리는 어떨까요? 사람들은 폭탄이 터진 수 킬로미터의 거리를 봉쇄해 오프(off)라고 부르기 시작했습니다. 당연하겠지만 오프 안으로 들어가는 건 미친 짓입니다. 당신의 목숨이 아깝지 않다면 시도해 보는 것도 괜찮겠네요.",
        choices: [
            { id: 102, label: "빠르게 요약 좀 해 주시겠어요?" },
            { id: 103, label: "이미 알고 있는 이야기니 빠르게 갑시다." }
        ],
        nodeType: 'intro'
    },
    102: {
        nodeId: 102,
        text: "모두 다 당신을 생각해서 드리는 말이니 조금만 더 집중해 주세요. 혼란과 어둠으로 뒤덮인 서울은 말 그대로의 무법도시였습니다. 소문에 따르면 무장 강도, 군대, 미친 과학자, 전염병 등의 천지였고요. 당신이 지금까지 목숨을 붙이고 있는 건 굉장한 천운일지도 모르겠습니다.",
        choices: [
            { id: 104, label: "지금 나는 어떤 상태죠?" }
        ],
        nodeType: 'intro'
    },
    200: {
        nodeId: 200,
        text: "당신이 가진 능력이 깨어났습니다...",
        choices: [
            { id: 2001, label: "계속 진행한다" }
        ],
        rewards: {
            abilities: []
        },
        nodeType: 'tutorial'
    },
    209: {
        nodeId: 209,
        text: "우리의 소지품 중 하나죠. 운 좋게도 남아 있는 것을 챙겨왔습니다. 가장 귀중한 무기, 권총입니다.\n\n권총을 획득했습니다!",
        choices: [
            { id: 2091, label: "그렇군요. 이제 출발하죠." }
        ],
        rewards: { items: [{ itemId: 5, quantity: 1 }] },
        nodeType: 'tutorial'
    },
    210: {
        nodeId: 210,
        text: '"잠깐. 빈손으로 그냥 가려고?"\n\n뒤에서 들려오는 목소리는 아주 익숙합니다. 그야 김필일의 목소리인걸요. 그는 당신의 손에 지폐 몇 장을 쥐여줍니다. 나름의 성의 표시겠죠.\n\n정말 출발합시다.',
        choices: [
            { id: 2101, label: "좋아, 출발!" }
        ],
        rewards: { gold: 100 },
        nodeType: 'tutorial'
    },
    300: {
        nodeId: 300,
        text: "길을 나선 당신은 당장 눈앞에 있는 세 갈래 길에 들어섭니다.\n\n왼쪽 길은 우리가 익히 다니던 통로로, 위험한 것은 존재하지 않는다는 걸 알고 있습니다.\n\n가운데 길은…… 어땠었죠? 기억이 잘 나지 않습니다.\n\n다만 오른쪽 길은 확실히 기억나네요. 김필일이 위험하니 가급적 들어서지 말라 당부한 곳이었습니다.",
        choices: [
            { id: 3001, label: "왼쪽 길 (루트 1. 정보원)" },
            { id: 3002, label: "가운데 길 (루트 2. 아르바이트)" },
            { id: 3003, label: "오른쪽 길 (루트 3. 현상수배지)" }
        ],
        nodeType: 'checkpoint'
    },
    310: {
        nodeId: 310,
        text: "익숙한 거리를 따라 걸어갑니다. 아무런 소리 하나 들리지 않네요. 길을 걷다 보면 문득 떠오르는 것이 있습니다.\n\n뭐죠?\n\n왼쪽 아래에서 세 번째 벽돌 중 반이 깨져있는 자리에 비상금을 숨겨둔 기억입니다. 이걸 깜빡할 뻔했네요. 가는 길에 챙겨가는 것도 좋겠죠.",
        choices: [
            { id: 310, label: "비상금을 챙긴다" }
        ],
        rewards: { gold: 50 },
        nodeType: 'main'
    },
    311: {
        nodeId: 311,
        text: "익숙한 거리를 걷다보면 꽤나 멀쩡해 보이는 편의점 건물이 보입니다. 한 번 뒤져보는 것도 좋겠죠.",
        choices: [
            { id: 311, label: "확인한다" },
            { id: 312, label: "그냥 간다" }
        ],
        nodeType: 'main'
    },
    312: {
        nodeId: 312,
        text: "운이 좋았습니다! 구석에 포장지가 살짝 찌그러진 진통제를 발견했습니다.",
        choices: [
            { id: 313, label: "계속 진행한다" }
        ],
        rewards: { items: [{ itemId: 1, quantity: 1 }] },
        nodeType: 'main'
    },
    313: {
        nodeId: 313,
        text: "역시 이렇게 멀쩡한 건물을 생존자들이 놔둘 리가 없죠. 내부는 텅 비었습니다. 아무리 뒤져도 쓸만한 것들은 보이지 않아요.",
        choices: [
            { id: 314, label: "다음 지역으로 간다" }
        ],
        nodeType: 'main'
    },
    320: {
        nodeId: 320,
        text: "호기심을 참지 못하고 가운데 길로 들어섭니다. 다행히 분위기는 그리 나쁘지 않네요. 아마 다른 사람들도 자주 드나드는 길목인 것 같습니다.\n\n꽤나 긴 골목길을 따라 오랫동안 걸어가다 보면…….\n\n아!\n\n깜짝이야. 누군가 당신을 붙잡습니다. 꽤나 나이가 어려 보이는 소년입니다. 그는 들고 있던 보따리를 열어 안에 든 것들을 보여줍니다.\n\n\"저기……. 혹시 물건 필요하지 않으세요? 분명 도움이 되실 거예요.\"",
        choices: [
            { id: 320, label: "[생태 지식 한 권으로 마스터하기]" },
            { id: 321, label: "[게임기]" },
            { id: 322, label: "[쓰레기도 맛있게 만들어주는 요리 비법]" },
            { id: 323, label: "안 사. 돌아가." }
        ],
        nodeType: 'main'
    },
    321: {
        nodeId: 321,
        text: "그림책으로 된 설명이 눈에 쏙쏙 들어옵니다. 꽤나 유용한 정보들 같아요.",
        choices: [
            { id: 324, label: "계속 진행한다" }
        ],
        rewards: { stat: '생태 지식', statValue: 1 },
        nodeType: 'main'
    },
    322: {
        nodeId: 322,
        text: "제대로 된 오락을 즐긴지도 벌써 얼마만인가요? 오랜만에 잡은 게임기에 시간 가는 줄도 모르고 삼매경에 빠집니다. 탐사 시작부터 아주 개운한 기분이에요.",
        choices: [
            { id: 324, label: "계속 진행한다" }
        ],
        rewards: { stat: '게임 실력', statValue: 1 },
        nodeType: 'main'
    },
    323: {
        nodeId: 323,
        text: "이런 시대에 책에 나와있는 재료들을 구할 수 있을까 싶지만……. 나쁘지 않은 내용들입니다. 초보자도 쉽게 따라할 수 있겠어요.",
        choices: [
            { id: 324, label: "계속 진행한다" }
        ],
        rewards: { stat: '요리 실력', statValue: 1 },
        nodeType: 'main'
    },
    330: {
        nodeId: 330,
        text: "스산한 거리. 빛 하나 보이지 않습니다. 들어서자마자 정체를 알 수 없는 악취가 풍깁니다.\n\n당신이 조심하며 걸어가던 도중, 물컹… 하고. 넘어지는 것도 순식간입니다. 넘어질 때 잘못 걸렸는지 팔뚝이 화끈거립니다. 뭐에 긁히기라도 했나 봐요.",
        choices: [
            { id: 330, label: "일어나서 확인한다" }
        ],
        rewards: { hp: -10 },
        nodeType: 'main'
    },
    331: {
        nodeId: 331,
        text: "이게 뭐죠?\n\n희미한 빛과 함께 시선을 집중하면 형체가 점차 또렷해집니다. 이건…… 시체네요. 죽은 지 시간은 꽤 지난 것 같습니다.\n\n보다 자세히 살펴보면 시신 다리의 절반 가량이 덫에 걸려 괴사한 것을 볼 수 있습니다. 만약 이 사람보다 먼저 이 길에 들어섰다면 누워있는 건 당신이 되었겠죠.",
        choices: [
            { id: 331, label: "시체를 더 살펴본다" },
            { id: 332, label: "도망갈래요!" }
        ],
        nodeType: 'main'
    },
    332: {
        nodeId: 332,
        text: "부패한 사체를 뒤지는 건 꽤나 정신적인 고통을 수반합니다. 역겨움을 참고 겨우 옷가지를 뒤지다 보면……. 아. 그래도 수확은 있었네요. 권총입니다.",
        choices: [
            { id: 333, label: "(관찰력) 시체를 매의 눈으로 살펴본다", requiresItemId: 11 },
            { id: 334, label: "이제 가죠" }
        ],
        rewards: { items: [{ itemId: 5, quantity: 1 }], energy: -10 },
        nodeType: 'main'
    },
    333: {
        nodeId: 333,
        text: "이제 이 물컹한 촉감이나 심한 악취에도 익숙해졌습니다. 매의 눈으로 시체를 샅샅이 훑어보던 당신은 손에 잡히는 익숙한 것을 알아챕니다.\n\n돈이에요. 이상하네요. 돈을 노리고 설치한 덫이 아니었던 걸까요? 그렇다면 누가, 무슨 목적으로? …… 어찌 됐든 더 이상 시신에서 얻을 것은 없어 보입니다.\n\n이제 정말 갑시다.",
        choices: [
            { id: 335, label: "계속 진행한다" }
        ],
        rewards: { gold: 100 },
        nodeType: 'main'
    },
    400: {
        nodeId: 400,
        text: "세 갈래 길을 지나 당신은 본격적으로 서울 시내 탐험에 나섭니다. 앞으로 어떤 일들이 기다리고 있을까요?",
        choices: [
            { id: 400, label: "탐험을 계속한다" }
        ],
        nodeType: 'checkpoint'
    },
    1001: {
        nodeId: 1001,
        text: "당신은 버려진 연구소 앞에 서 있습니다. 녹슨 철문이 삐걱거리며 열려있고, 안에서는 이상한 소음이 들려옵니다. 오늘의 조사를 시작합니다.",
        choices: [
            { id: 1, label: "조심스럽게 안으로 들어간다" }
        ],
        nodeType: 'checkpoint'
    },
    1002: {
        nodeId: 1002,
        text: "복도를 걷다가 갈림길을 발견했습니다. 어느 쪽으로 갈까요?",
        choices: [
            { id: 2, label: "왼쪽 복도로 간다" },
            { id: 3, label: "오른쪽 복도로 간다" }
        ],
        nodeType: 'random',
        rewards: { gold: 10 }
    },
    1003: {
        nodeId: 1003,
        text: "왼쪽 복도에서 낡은 상자를 발견했습니다. 열어볼까요?",
        choices: [
            { id: 4, label: "조심스럽게 연다" },
            { id: 5, label: "그냥 지나친다" }
        ],
        nodeType: 'random'
    },
    1004: {
        nodeId: 1004,
        text: "오른쪽 복도는 더 어둡고 음침합니다. 이상한 기운이 느껴집니다.",
        choices: [
            { id: 6, label: "용기를 내어 계속 진행한다" },
            { id: 7, label: "돌아가서 다른 길로 간다" }
        ],
        nodeType: 'random',
        rewards: { hp: -5 }
    },
    1005: {
        nodeId: 1005,
        text: "상자 안에는 오래된 일기장이 들어있습니다. 읽어보니 연구소의 비밀에 대한 단서가 있네요.",
        choices: [
            { id: 8, label: "일기장을 챙기고 계속 진행한다" }
        ],
        nodeType: 'random',
        rewards: { items: [{ itemId: 5, quantity: 1 }] }
    },
    1006: {
        nodeId: 1006,
        text: "벽에서 이상한 소리가 들립니다. 벽을 두드려보니 빈 공간이 있는 것 같습니다.",
        choices: [
            { id: 9, label: "벽을 부숴본다" },
            { id: 10, label: "무시하고 지나간다" }
        ],
        nodeType: 'random'
    },
    1007: {
        nodeId: 1007,
        text: "연구소 중앙 홀에 도착했습니다. 거대한 실험 장치가 여전히 작동하고 있고, 모니터에는 'PROJECT ALPHA' 라는 글자가 깜빡이고 있습니다.",
        choices: [
            { id: 11, label: "실험 장치를 조사한다" },
            { id: 12, label: "모니터를 확인한다" }
        ],
        nodeType: 'main'
    },
    1008: {
        nodeId: 1008,
        text: "실험 장치에서 미약한 에너지가 감지됩니다. 당신의 몸에 이상한 힘이 깨어나는 것을 느낍니다. [능력: 전기 조작] 을 획득했습니다!",
        choices: [
            { id: 13, label: "능력을 시험해본다" }
        ],
        nodeType: 'main',
        rewards: {
            abilities: [{ abilityId: 1 }],
            energy: 20
        }
    },
    1009: {
        nodeId: 1009,
        text: "모니터를 확인하니 연구소의 지도와 중요 구역들이 표시되어 있습니다. 이것은 매우 유용한 정보입니다.",
        choices: [
            { id: 14, label: "지도를 저장하고 계속 진행한다" }
        ],
        nodeType: 'main',
        rewards: { gold: 50 }
    },
    1010: {
        nodeId: 1010,
        text: "좁은 통로를 지나가다 함정을 발견했습니다. 조심스럽게 우회해야 할 것 같습니다.",
        choices: [
            { id: 15, label: "천천히 우회한다" },
            { id: 16, label: "재빨리 뛰어넘는다" }
        ],
        nodeType: 'random'
    },
    1011: {
        nodeId: 1011,
        text: "천천히 우회하는 동안 벽에서 미끄러졌지만, 다행히 큰 부상은 없었습니다.",
        choices: [
            { id: 17, label: "계속 진행한다" }
        ],
        nodeType: 'random',
        rewards: { hp: -10 }
    },
    1012: {
        nodeId: 1012,
        text: "성공적으로 함정을 넘었습니다! 반대편에 치료 아이템이 놓여있네요.",
        choices: [
            { id: 18, label: "아이템을 챙긴다" }
        ],
        nodeType: 'random',
        rewards: { items: [{ itemId: 1, quantity: 2 }] }
    },
    1013: {
        nodeId: 1013,
        text: "실험실에서 이상한 생물체의 흔적을 발견했습니다. 아직 멀리 가지 않은 것 같습니다.",
        choices: [
            { id: 19, label: "흔적을 따라간다" },
            { id: 20, label: "피해서 다른 곳으로 간다" }
        ],
        nodeType: 'random'
    },
    1014: {
        nodeId: 1014,
        text: "생물체를 발견했지만 다행히 공격성은 없어 보입니다. 조심스럽게 지나갑니다.",
        choices: [
            { id: 21, label: "계속 진행한다" }
        ],
        nodeType: 'random',
        rewards: { energy: 10 }
    },
    1015: {
        nodeId: 1015,
        text: "연구소 깊은 곳에서 거대한 문을 발견했습니다. 문에는 'DIRECTOR OFFICE' 라고 적혀있고, 마스터키가 필요해 보입니다.",
        choices: [
            { id: 22, label: "마스터키를 사용해서 연다", requiresItemId: 3 },
            { id: 23, label: "문을 부수려고 시도한다" }
        ],
        nodeType: 'main'
    },
    1016: {
        nodeId: 1016,
        text: "소장실에 들어가자 컴퓨터가 켜져 있습니다. 화면에는 '피실험자 명단'이 표시되어 있고, 당신의 이름도 그 목록에 있습니다...",
        choices: [
            { id: 24, label: "더 많은 정보를 찾아본다" }
        ],
        nodeType: 'main',
        rewards: { gold: 100 }
    },
    1017: {
        nodeId: 1017,
        text: "파일을 읽어보니 이 연구소에서는 인간에게 초능력을 부여하는 실험을 하고 있었습니다. 그리고 당신도... 그 실험의 대상이었습니다.",
        choices: [
            { id: 25, label: "충격적인 진실을 받아들이고 계속 조사한다" }
        ],
        nodeType: 'main'
    },
    1018: {
        nodeId: 1018,
        text: "오늘의 조사는 여기까지입니다. 많은 것을 알게 되었지만, 여전히 풀리지 않은 의문들이 남아있습니다. 다음 조사 시간을 기다립니다...",
        choices: [],
        isEndNode: true,
        nodeType: 'checkpoint',
        rewards: {
            gold: 50,
            energy: 30,
            hp: 20
        }
    }
};
exports.CHOICE_TO_NODE = {
    100: 101,
    101: 102,
    102: 200,
    103: 200,
    104: 200,
    2001: 209,
    2091: 210,
    2101: 300,
    3001: 'MAIN_STORY_ROUTE_1',
    3002: 'MAIN_STORY_ROUTE_2',
    3003: 'MAIN_STORY_ROUTE_3',
    310: 311,
    311: 312,
    312: 313,
    313: 400,
    314: 400,
    320: 321,
    321: 322,
    322: 323,
    323: 400,
    324: 400,
    330: 331,
    331: 332,
    332: 334,
    333: 335,
    334: 400,
    335: 400,
    400: 1001,
    1: 1002,
    2: 1003,
    3: 1004,
    4: 1005,
    5: 1006,
    6: 1006,
    7: 1003,
    8: 1007,
    9: 1007,
    10: 1007,
    11: 1008,
    12: 1009,
    13: 1010,
    14: 1010,
    15: 1011,
    16: 1012,
    17: 1013,
    18: 1013,
    19: 1014,
    20: 1014,
    21: 1015,
    22: 1016,
    23: 1017,
    24: 1017,
    25: 1018
};
exports.RANDOM_STORY_POOL = [1002, 1003, 1004, 1005, 1006, 1010, 1011, 1012, 1013, 1014];
exports.MAIN_STORY_POOL = [1007, 1008, 1009, 1015, 1016, 1017];
exports.CHECKPOINT_NODES = [1001, 1018, 300];
exports.INTRO_NODES = [100, 101, 102];
exports.TUTORIAL_NODES = [200, 209, 210];
//# sourceMappingURL=storyNodes.js.map