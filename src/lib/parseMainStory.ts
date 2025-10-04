// 메인 스토리 Twine 데이터를 파싱하여 노드로 변환하는 유틸리티

export interface TwinePassage {
  title: string;
  text: string;
  choices: Array<{
    label: string;
    target: string;
    requirement?: string;
  }>;
}

// 노드 ID 매핑 (Twine 제목 -> 노드 ID)
export const PASSAGE_TO_NODE_ID: Record<string, number> = {
  // 체크포인트 1 - 세 갈래 길 (이미 존재)
  '시작 노드 (선택지 3개)': 300,
  
  // 루트 1 - 정보원
  '루트 1': 400,
  '루트 1-1. 정보 파는 사람': 410,
  '루트 1-2. 무장 강도': 420,
  
  // 루트 2 - 아르바이트
  '루트 2': 500,
  '루트 2-1. 쫓기는 학생': 510,
  '루트 2-2. 수상한 테러범': 520,
  
  // 루트 3 - 현상수배지
  '루트 3': 600,
  '루트 3-1. 부상 당한 미군': 610,
  '루트 3-2. 사기꾼': 620,
  
  // 하위 노드들 (자동 할당)
  // 400번대: 루트 1
  // 500번대: 루트 2
  // 600번대: 루트 3
  // 700번대: 공통 체크포인트
  // 800번대: 엔딩
};

// 능력 요구사항 파싱
export function parseRequirement(text: string): { 
  type?: 'ability' | 'item' | 'stat',
  name?: string,
  level?: number 
} | null {
  // [매력 Lv.2] 형식
  const abilityMatch = text.match(/\[([가-힣\s]+)\s+Lv\.(\d+)\]/);
  if (abilityMatch) {
    return {
      type: 'ability',
      name: abilityMatch[1].trim(),
      level: parseInt(abilityMatch[2])
    };
  }
  
  // (관찰력) 형식
  const simpleAbilityMatch = text.match(/\(([가-힣]+)\)/);
  if (simpleAbilityMatch) {
    return {
      type: 'ability',
      name: simpleAbilityMatch[1],
      level: 1
    };
  }
  
  return null;
}

// 보상 파싱
export function parseRewards(text: string): {
  hp?: number;
  energy?: number;
  gold?: number;
  items?: Array<{ itemId: number; quantity: number }>;
  abilities?: Array<{ abilityId: number }>;
} {
  const rewards: any = {};
  
  // 체력, 정신, 돈 변화
  const hpMatch = text.match(/체력\s*([+-]\d+)/);
  if (hpMatch) rewards.hp = parseInt(hpMatch[1]) * 33.33;
  
  const energyMatch = text.match(/멘탈\s*([+-]\d+)|정신\s*([+-]\d+)/);
  if (energyMatch) rewards.energy = parseInt(energyMatch[1] || energyMatch[2]) * 33.33;
  
  const goldMatch = text.match(/돈\s*([+-]\d+)/);
  if (goldMatch) rewards.gold = parseInt(goldMatch[1]);
  
  return rewards;
}

