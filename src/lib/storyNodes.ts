// 스토리 노드 타입 정의
export interface StoryChoice {
  id: number;
  label: string;
  requiresItemId?: number;
}

export interface StoryReward {
  hp?: number;
  energy?: number;
  gold?: number;
  items?: Array<{ itemId: number; quantity: number }>;
}

export interface StoryNode {
  nodeId: number;
  text: string;
  choices: StoryChoice[];
  rewards?: StoryReward;
  isEndNode?: boolean;
}

// 스토리 노드 데이터 (1일차)
export const STORY_NODES: Record<number, StoryNode> = {
  // 시작 노드
  1001: {
    nodeId: 1001,
    text: "당신은 버려진 연구소 앞에 서 있습니다. 녹슨 철문이 삐걱거리며 열려있고, 안에서는 이상한 소음이 들려옵니다.",
    choices: [
      { id: 1, label: "조심스럽게 안으로 들어간다" },
      { id: 2, label: "문 주변을 더 살펴본다" },
      { id: 3, label: "손전등을 사용해서 들어간다", requiresItemId: 4 }
    ]
  },

  // 선택 1: 조심스럽게 들어감
  1002: {
    nodeId: 1002,
    text: "어둠 속에서 발을 헛디뎌 넘어집니다. 다행히 큰 부상은 없지만 약간의 체력을 잃었습니다.",
    choices: [
      { id: 4, label: "일어나서 계속 진행한다" },
      { id: 5, label: "치료 포션을 사용한다", requiresItemId: 1 }
    ],
    rewards: { hp: -10 }
  },

  // 선택 2: 문 주변 살펴봄
  1003: {
    nodeId: 1003,
    text: "문 옆 덤불에서 반짝이는 무언가를 발견했습니다. 작은 금화 몇 개가 떨어져 있네요!",
    choices: [
      { id: 6, label: "금화를 주워서 연구소로 들어간다" },
      { id: 7, label: "금화를 놔두고 그냥 들어간다" }
    ],
    rewards: { gold: 50 }
  },

  // 선택 3: 손전등 사용
  1004: {
    nodeId: 1004,
    text: "손전등의 밝은 빛이 연구소 내부를 비춥니다. 바닥에는 여러 실험 도구들이 흩어져 있고, 벽에는 이상한 기호들이 그려져 있습니다.",
    choices: [
      { id: 8, label: "실험 도구를 조사한다" },
      { id: 9, label: "벽의 기호를 자세히 본다" },
      { id: 10, label: "더 깊숙이 들어간다" }
    ]
  },

  // 계속 진행 (선택 4)
  1005: {
    nodeId: 1005,
    text: "복도를 따라 걷다가 갈림길에 도착했습니다. 왼쪽에서는 기계 소리가, 오른쪽에서는 물 떨어지는 소리가 들립니다.",
    choices: [
      { id: 11, label: "왼쪽 복도로 간다" },
      { id: 12, label: "오른쪽 복도로 간다" }
    ]
  },

  // 치료 포션 사용 (선택 5)
  1006: {
    nodeId: 1006,
    text: "치료 포션을 마시니 상처가 빠르게 아뭅니다. 체력이 회복되었습니다!",
    choices: [
      { id: 13, label: "기분 좋게 계속 진행한다" }
    ],
    rewards: { hp: 50 }
  },

  // 실험 도구 조사 (선택 8)
  1007: {
    nodeId: 1007,
    text: "실험 도구들 사이에서 에너지 드링크를 발견했습니다. 아직 마실 수 있을 것 같네요.",
    choices: [
      { id: 14, label: "에너지 드링크를 챙기고 계속 진행한다" },
      { id: 15, label: "의심스러우니 놔두고 간다" }
    ],
    rewards: { items: [{ itemId: 2, quantity: 1 }] }
  },

  // 벽의 기호 조사 (선택 9)
  1008: {
    nodeId: 1008,
    text: "기호들을 자세히 보니 어떤 암호 같습니다. 해독하는데 시간이 걸리지만, 숨겨진 보물의 위치를 알아냈습니다!",
    choices: [
      { id: 16, label: "보물 위치로 간다" },
      { id: 17, label: "너무 위험할 것 같으니 그냥 진행한다" }
    ]
  },

  // 보물 발견 (선택 16)
  1009: {
    nodeId: 1009,
    text: "벽 뒤 숨겨진 공간에서 마스터키를 발견했습니다! 이것으로 잠긴 문들을 열 수 있을 것 같습니다.",
    choices: [
      { id: 18, label: "마스터키를 가지고 연구소 깊숙이 들어간다" }
    ],
    rewards: { items: [{ itemId: 3, quantity: 1 }] }
  },

  // 최종 노드 예시
  1010: {
    nodeId: 1010,
    text: "연구소의 비밀을 일부 밝혀냈습니다. 오늘의 조사는 여기서 마무리됩니다. 내일 더 깊은 곳을 탐험해보세요.",
    choices: [],
    isEndNode: true,
    rewards: { gold: 100, energy: 20 }
  }
};

// 선택에 따른 다음 노드 매핑
export const CHOICE_TO_NODE: Record<number, number> = {
  1: 1002,  // 조심스럽게 들어감
  2: 1003,  // 문 주변 살펴봄
  3: 1004,  // 손전등 사용
  4: 1005,  // 일어나서 계속
  5: 1006,  // 치료 포션 사용
  6: 1005,  // 금화 주워서 진행
  7: 1005,  // 금화 놔두고 진행
  8: 1007,  // 실험 도구 조사
  9: 1008,  // 벽의 기호 조사
  10: 1005, // 더 깊숙이
  11: 1010, // 왼쪽 복도 (임시 종료)
  12: 1010, // 오른쪽 복도 (임시 종료)
  13: 1005, // 치료 후 계속
  14: 1005, // 에너지 드링크 챙김
  15: 1005, // 에너지 드링크 놔둠
  16: 1009, // 보물 위치로
  17: 1005, // 그냥 진행
  18: 1010  // 마스터키로 최종
}; 