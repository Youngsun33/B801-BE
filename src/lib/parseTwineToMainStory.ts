// Twine 형식의 메인 스토리를 파싱하여 DB 시드 데이터로 변환

export interface ParsedMainStory {
  node_id: number;
  title: string;
  text: string;
  node_type: string;
  route_name: string | null;
  choices: string; // JSON
  rewards: string | null; // JSON
  position_x?: number; // Twine 에디터 X 좌표
  position_y?: number; // Twine 에디터 Y 좌표
}

export interface TwineChoice {
  id: number;
  targetNodeId: number; // 다음 노드 ID
  label: string;
  requirement?: {
    type: 'ability' | 'item' | 'stat';
    name: string;
    level?: number;
  };
  probability?: number;
}

// 노드 ID 카운터 (400번부터 시작)
let currentNodeId = 400;
const nodeMapping = new Map<string, number>();

// 체크포인트 감지
function isCheckpoint(text: string): boolean {
  return text.includes('체크 포인트') || text.includes('체크포인트');
}

// 루트명 추출
function extractRouteName(title: string): string | null {
  if (title.includes('루트 1')) return '루트 1';
  if (title.includes('루트 2')) return '루트 2';
  if (title.includes('루트 3')) return '루트 3';
  return null;
}

// 선택지 파싱
function parseChoice(choiceText: string, nodeIdCounter: { value: number }): TwineChoice {
  // Twine 링크 형식:
  // 1. [[텍스트->타겟]] 또는 [[텍스트|타겟]]
  // 2. [[텍스트]] (타겟은 텍스트 자체)
  
  // 먼저 [[...]] 추출
  const bracketMatch = choiceText.match(/\[\[(.+?)\]\]/);
  if (!bracketMatch) {
    console.warn(`Warning: Invalid choice format, skipping: ${choiceText.substring(0, 50)}`);
    throw new Error(`Invalid choice format: ${choiceText.substring(0, 50)}`);
  }

  const innerText = bracketMatch[1];
  
  // -> 또는 | 로 분리
  let displayText: string;
  let targetPassage: string;
  
  if (innerText.includes('->')) {
    const parts = innerText.split('->');
    displayText = parts[0].trim();
    targetPassage = parts[1].trim();
  } else if (innerText.includes('|')) {
    const parts = innerText.split('|');
    displayText = parts[0].trim();
    targetPassage = parts[1].trim();
  } else {
    // 타겟이 없으면 텍스트 자체가 타겟 passage 제목
    displayText = innerText.trim();
    targetPassage = innerText.trim();
  }
  
  return parseChoiceInternal(displayText, targetPassage, nodeIdCounter);
}

function parseChoiceInternal(displayText: string, targetPassage: string, nodeIdCounter: { value: number }): TwineChoice {
  let label = displayText;
  
  // 능력 요구사항 파싱: [매력 Lv.2], (관찰력) 등
  let requirement: TwineChoice['requirement'];
  
  // [능력 Lv.레벨] 형식
  const abilityLevelMatch = label.match(/\[([가-힣\s]+)\s+Lv\.(\d+)\]/);
  if (abilityLevelMatch) {
    requirement = {
      type: 'ability',
      name: abilityLevelMatch[1].trim(),
      level: parseInt(abilityLevelMatch[2])
    };
    label = label.replace(abilityLevelMatch[0], '').trim();
  }
  
  // (능력) 형식
  const simpleAbilityMatch = label.match(/\(([가-힣]+)\)/);
  if (simpleAbilityMatch) {
    requirement = {
      type: 'ability',
      name: simpleAbilityMatch[1],
      level: 1
    };
    label = label.replace(simpleAbilityMatch[0], '').trim();
  }

  // 확률 파싱: "확률 50%"
  let probability: number | undefined;
  const probabilityMatch = label.match(/확률\s+(\d+)%/);
  if (probabilityMatch) {
    probability = parseInt(probabilityMatch[1]);
    label = label.replace(probabilityMatch[0], '').trim();
  }

  // "- " 제거 (표시용 label에서만)
  label = label.replace(/^-\s*/, '').trim();

  // 타겟 노드 ID 결정 (targetPassage를 키로 사용)
  let targetNodeId: number;
  if (nodeMapping.has(targetPassage)) {
    targetNodeId = nodeMapping.get(targetPassage)!;
  } else {
    // 아직 매핑되지 않은 passage면 새 ID 할당 (PASS 1에서 이미 할당되어 있어야 함)
    console.warn(`⚠️ Warning: Target passage "${targetPassage}" not found in mapping. Creating new ID.`);
    targetNodeId = nodeIdCounter.value++;
    nodeMapping.set(targetPassage, targetNodeId);
  }

  return {
    id: targetNodeId,
    targetNodeId: targetNodeId,
    label,
    requirement,
    probability
  };
}

// 보상 파싱
function parseRewards(text: string): any {
  const rewards: any = {};

  // 체력: "체력 -1", "체력 +1"
  const hpMatch = text.match(/체력\s*([+-]\d+)/);
  if (hpMatch) {
    rewards.hp = parseInt(hpMatch[1]) * 33.33;
  }

  // 멘탈/정신: "멘탈 -1", "정신 +1"
  const energyMatch = text.match(/(멘탈|정신)\s*([+-]\d+)/);
  if (energyMatch) {
    rewards.energy = parseInt(energyMatch[2]) * 33.33;
  }

  // 돈: "돈 +1", "(돈 -1)"
  const goldMatch = text.match(/돈\s*([+-]\d+)/);
  if (goldMatch) {
    rewards.gold = parseInt(goldMatch[1]);
  }

  // 능력: "관찰력 +1", "악행 +1" 등
  const abilityMatches = text.matchAll(/([가-힣]+)\s*\+(\d+)/g);
  for (const match of abilityMatches) {
    const abilityName = match[1];
    const value = parseInt(match[2]);
    // 이건 스토리 능력으로 저장 (실제 ID는 나중에 매핑)
    if (!rewards.abilities) rewards.abilities = [];
    rewards.abilities.push({ name: abilityName, value });
  }

  // 아이템: "권총 +1", "진통제 +1" 등
  // 이것도 나중에 매핑 필요

  return Object.keys(rewards).length > 0 ? rewards : null;
}

// 단일 Twine 패시지 파싱
export function parseTwinePassage(
  title: string,
  content: string,
  nodeIdCounter: { value: number },
  positionX?: number,
  positionY?: number
): ParsedMainStory {
  // 노드 ID 결정
  let nodeId: number;
  if (nodeMapping.has(title)) {
    nodeId = nodeMapping.get(title)!;
  } else {
    nodeId = nodeIdCounter.value++;
    nodeMapping.set(title, nodeId);
  }

  // 텍스트와 선택지 분리
  const lines = content.split('\n').filter(line => line.trim());
  const textLines: string[] = [];
  const choiceLines: string[] = [];

  for (const line of lines) {
    if (line.includes('[[')) {
      choiceLines.push(line);
    } else {
      textLines.push(line);
    }
  }

  const text = textLines.join('\n').trim();
  
  // 선택지 파싱 (디버깅 로그 추가)
  const choices = choiceLines.map(line => {
    try {
      const choice = parseChoice(line, nodeIdCounter);
      console.log(`    Choice: "${choice.label}" -> node ${choice.targetNodeId}`);
      return choice;
    } catch (error) {
      console.error(`    ❌ Failed to parse choice: ${line}`);
      throw error;
    }
  });

  // 노드 타입 결정
  const nodeType = isCheckpoint(text) ? 'checkpoint' : 'main';

  // 루트명 추출
  const routeName = extractRouteName(title);

  // 보상 파싱
  const rewards = parseRewards(text);

  return {
    node_id: nodeId,
    title,
    text,
    node_type: nodeType,
    route_name: routeName,
    choices: JSON.stringify(choices),
    rewards: rewards ? JSON.stringify(rewards) : null,
    position_x: positionX,
    position_y: positionY
  };
}

// 전체 Twine 문서 파싱
export function parseTwineDocument(twineContent: string): ParsedMainStory[] {
  const passages: ParsedMainStory[] = [];
  const nodeIdCounter = { value: 400 };

  // 노드 매핑 초기화
  nodeMapping.clear();

  // Twine 패시지 분리: ":: 제목"으로 시작
  // 더 간단하고 명확한 정규식 사용
  const passageRegex = /^:: (.+?)$/gm;
  const matches = [...twineContent.matchAll(passageRegex)];

  console.log('Parsing Twine content, length:', twineContent.length);
  console.log('Found', matches.length, 'passages');

  // PASS 1: 모든 패시지 제목에 노드 ID 미리 할당
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    let fullTitle = match[1].trim();
    
    // 메타데이터는 건너뛰기
    if (fullTitle.startsWith('StoryTitle') || fullTitle.startsWith('StoryData')) {
      continue;
    }
    
    // 제목에서 위치 정보 제거 (Twee 형식)
    const title = fullTitle.replace(/\s*\{[^}]+\}\s*$/, '').trim();
    
    // 이미 매핑된 제목이 아니면 새 ID 할당
    if (!nodeMapping.has(title)) {
      nodeMapping.set(title, nodeIdCounter.value++);
    }
  }
  
  console.log(`Pre-allocated ${nodeMapping.size} node IDs`);
  
  // PASS 2: 실제 내용 파싱
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    let fullTitle = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : twineContent.length;
    const content = twineContent.substring(startIndex, endIndex).trim();

    console.log(`Found passage: "${fullTitle}"`);

    // StoryTitle, StoryData 같은 메타데이터는 건너뛰기
    if (fullTitle.startsWith('StoryTitle') || fullTitle.startsWith('StoryData')) {
      console.log(`  -> Skipping metadata`);
      continue;
    }

    // 위치 정보 추출 (제목 줄에서 먼저 찾기 - Twee 형식)
    let positionX: number | undefined;
    let positionY: number | undefined;
    let title = fullTitle;
    
    // 제목에서 위치 정보 추출
    const titlePositionMatch = fullTitle.match(/\{"position":"(\d+),(\d+)"/);
    if (titlePositionMatch) {
      positionX = parseInt(titlePositionMatch[1]);
      positionY = parseInt(titlePositionMatch[2]);
      // 제목에서 위치 정보 제거
      title = fullTitle.replace(/\s*\{[^}]+\}\s*$/, '').trim();
      console.log(`  -> Position from title: (${positionX}, ${positionY})`);
    } else {
      // content에서도 찾아보기 (Twine HTML 형식)
      const contentPositionMatch = content.match(/\{"position":"(\d+),(\d+)"\}/);
      if (contentPositionMatch) {
        positionX = parseInt(contentPositionMatch[1]);
        positionY = parseInt(contentPositionMatch[2]);
        console.log(`  -> Position from content: (${positionX}, ${positionY})`);
      }
    }

    // content에서 위치 정보 제거
    const cleanContent = content.replace(/\{"position".+?\}/g, '').trim();

    try {
      console.log(`  Parsing passage "${title}"...`);
      const parsed = parseTwinePassage(title, cleanContent, nodeIdCounter, positionX, positionY);
      passages.push(parsed);
      console.log(`  ✅ Parsed: node_id=${parsed.node_id}, position=(${positionX}, ${positionY}), choices=${parsed.choices}`);
    } catch (error) {
      console.error(`  ❌ Error parsing passage "${title}":`, error);
    }
  }

  return passages;
}

