// Twine 형식의 메인 스토리를 파싱하여 DB 시드 데이터로 변환

export interface ParsedMainStory {
  node_id: number;
  title: string;
  text: string;
  node_type: string;
  route_name: string | null;
  choices: string; // JSON
  rewards: string | null; // JSON
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
  // [[선택지 텍스트]]->타겟 또는 [[선택지 텍스트]]
  // ->를 먼저 찾고, 없으면 HTML 엔티티 확인
  let linkMatch = choiceText.match(/\[\[(.+?)\]\](?:->(.+?))?$/);
  if (!linkMatch) {
    linkMatch = choiceText.match(/\[\[(.+?)\]\](?:-&gt;(.+?))?$/);
  }
  
  if (!linkMatch) {
    console.warn(`Warning: Invalid choice format, skipping: ${choiceText.substring(0, 50)}`);
    throw new Error(`Invalid choice format: ${choiceText.substring(0, 50)}`);
  }

  const label = linkMatch[1].trim();
  const target = linkMatch[2]?.trim();
  
  return parseChoiceInternal(label, target, nodeIdCounter);
}

function parseChoiceInternal(label: string, target: string | undefined, nodeIdCounter: { value: number }): TwineChoice {

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

  // "- " 제거
  label = label.replace(/^-\s*/, '').trim();

  // 타겟 노드 ID 결정
  let targetNodeId: number;
  if (target && nodeMapping.has(target)) {
    targetNodeId = nodeMapping.get(target)!;
  } else if (target) {
    targetNodeId = nodeIdCounter.value++;
    nodeMapping.set(target, targetNodeId);
  } else {
    // 타겟이 없으면 label을 타겟으로 사용 (자동 연결)
    if (nodeMapping.has(label)) {
      targetNodeId = nodeMapping.get(label)!;
    } else {
      targetNodeId = nodeIdCounter.value++;
      // 선택지 label을 키로 사용하지 않음 (충돌 방지)
    }
  }

  return {
    id: targetNodeId, // 선택지 ID (UI에서 사용)
    targetNodeId: targetNodeId, // 다음 노드 ID
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
  nodeIdCounter: { value: number }
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
  const choices = choiceLines.map(line => parseChoice(line, nodeIdCounter));

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
    rewards: rewards ? JSON.stringify(rewards) : null
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
    const title = match[1].trim();
    
    // 메타데이터는 건너뛰기
    if (title.startsWith('StoryTitle') || title.startsWith('StoryData')) {
      continue;
    }
    
    // 이미 매핑된 제목이 아니면 새 ID 할당
    if (!nodeMapping.has(title)) {
      nodeMapping.set(title, nodeIdCounter.value++);
    }
  }
  
  console.log(`Pre-allocated ${nodeMapping.size} node IDs`);
  
  // PASS 2: 실제 내용 파싱
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : twineContent.length;
    const content = twineContent.substring(startIndex, endIndex).trim();

    console.log(`Found passage: "${title}"`);

    // StoryTitle, StoryData 같은 메타데이터는 건너뛰기
    if (title.startsWith('StoryTitle') || title.startsWith('StoryData')) {
      console.log(`  -> Skipping metadata`);
      continue;
    }

    // 위치 정보 등은 제거
    const cleanContent = content.replace(/\{"position".+?\}/g, '').trim();

    try {
      const parsed = parseTwinePassage(title, cleanContent, nodeIdCounter);
      passages.push(parsed);
      console.log(`  -> Parsed successfully, node ID: ${parsed.node_id}`);
    } catch (error) {
      console.error(`  -> Error parsing passage "${title}":`, error);
    }
  }

  return passages;
}

