import * as fs from 'fs';
import { prisma } from './prisma';

interface StoryChoice {
  text: string;
  requirements?: {
    skill?: string;
    level?: number;
    item?: string;
  };
}

interface StoryOutcome {
  choiceText: string;
  results: string[];
  rewards?: {
    stat?: string;
    value?: number;
    item?: string;
    quantity?: number;
  }[];
}

interface ParsedStory {
  id: number;
  title: string;
  description: string;
  choices: StoryChoice[];
  outcomes: StoryOutcome[];
  category?: string;
}

function parseRequirement(text: string): { skill?: string; level?: number; item?: string } | null {
  // (관찰력), (민첩함 Lv.2), (권총) 등을 파싱
  const match = text.match(/\(([^)]+)\)/);
  if (!match) return null;

  const content = match[1];
  
  // 레벨이 있는 경우
  const levelMatch = content.match(/(.+?)\s*Lv\.(\d+)/i);
  if (levelMatch) {
    return { skill: levelMatch[1].trim(), level: parseInt(levelMatch[2]) };
  }

  // 아이템인지 스킬인지 판단
  const items = ['권총', '물', '식량', '돈', '생수', '우비', '살충제', '강아지', '손전등'];
  if (items.includes(content)) {
    return { item: content };
  }

  return { skill: content };
}

function parseRewards(text: string): any[] {
  const rewards: any[] = [];
  
  // 멘탈은 정신력으로 처리
  const mentalMatch = text.match(/멘탈\s*([+-]\d+)/);
  if (mentalMatch) {
    rewards.push({
      stat: 'energy',
      value: parseInt(mentalMatch[1]) * 33.33
    });
  }

  // 체력 +1 등 (멘탈 제외)
  const statMatches = text.matchAll(/(체력|관찰력|근력|민첩함|은신술|손재주|언변술|매력|직감|사격술|게임 실력|생태 지식|요리 실력|응급처치|기계공학|영어|선행|악행)\s*([+-])\s*(\d+)/g);
  for (const match of statMatches) {
    rewards.push({
      stat: match[1],
      value: parseInt(match[3]) * (match[2] === '+' ? 1 : -1)
    });
  }

  // 아이템 획득
  const itemMatches = text.matchAll(/(돈|식량|물|생수|진통제|의약품|우비|붕대|권총|총)\s*\+(\d+)/g);
  for (const match of itemMatches) {
    rewards.push({
      item: match[1],
      quantity: parseInt(match[2])
    });
  }

  // 단순 아이템 획득 (수량 없이)
  if (text.includes('획득') || text.includes('+')) {
    const simpleItemMatch = text.match(/(진통제|의약품|우비|붕대|권총|마스터키|손전등) 획득/);
    if (simpleItemMatch) {
      rewards.push({
        item: simpleItemMatch[1],
        quantity: 1
      });
    }
  }

  return rewards;
}

export function parseStoryFile(filePath: string): ParsedStory[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const stories: ParsedStory[] = [];
  let currentStory: Partial<ParsedStory> | null = null;
  let currentSection: 'description' | 'choices' | 'outcomes' | null = null;
  let currentOutcome: Partial<StoryOutcome> | null = null;
  let descriptionLines: string[] = [];
  let outcomeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 빈 줄 건너뛰기
    if (!line) {
      if (currentSection === 'description' && descriptionLines.length > 0) {
        // 설명 끝
        currentSection = null;
      }
      continue;
    }

    // 새로운 스토리 시작 (숫자. 제목 형식)
    const storyMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (storyMatch && !line.startsWith('1-') && !line.includes('선택')) {
      // 이전 스토리 저장
      if (currentStory && currentStory.title) {
        if (descriptionLines.length > 0) {
          currentStory.description = descriptionLines.join(' ').trim();
        }
        stories.push(currentStory as ParsedStory);
      }

      // 새 스토리 시작
      currentStory = {
        id: parseInt(storyMatch[1]),
        title: storyMatch[2].trim(),
        description: '',
        choices: [],
        outcomes: []
      };
      descriptionLines = [];
      currentSection = 'description';
      currentOutcome = null;
      continue;
    }

    // 선택지 (- 로 시작)
    if (line.startsWith('-') && currentStory) {
      const choiceText = line.substring(1).trim();
      
      // 선택지의 결과인지 선택지인지 판단
      if (currentSection === 'outcomes' && choiceText.length > 0) {
        // 결과의 세부 내용
        if (currentOutcome) {
          outcomeLines.push(choiceText);
        }
      } else {
        // 새로운 선택지
        if (currentSection === 'description') {
          currentStory.description = descriptionLines.join(' ').trim();
          descriptionLines = [];
          currentSection = 'choices';
        }
        
        const requirement = parseRequirement(choiceText);
        const cleanText = choiceText.replace(/\([^)]+\)/g, '').trim();
        
        currentStory.choices!.push({
          text: cleanText,
          requirements: requirement || undefined
        });
      }
      continue;
    }

    // 결과 (* 로 시작하거나 선택지 반복)
    if (line.startsWith('*') || (currentSection === 'choices' && line.startsWith('-'))) {
      if (currentSection === 'choices') {
        currentSection = 'outcomes';
      }
      
      if (line.startsWith('*')) {
        // 이전 결과 저장
        if (currentOutcome && outcomeLines.length > 0) {
          currentOutcome.results = outcomeLines;
          currentStory!.outcomes!.push(currentOutcome as StoryOutcome);
          outcomeLines = [];
        }

        // 새 결과 시작
        const resultText = line.substring(1).trim();
        currentOutcome = {
          choiceText: resultText,
          results: []
        };
      }
      continue;
    }

    // 설명 또는 결과 내용
    if (currentSection === 'description') {
      descriptionLines.push(line);
    } else if (currentSection === 'outcomes' && line.length > 0) {
      outcomeLines.push(line);
    }
  }

  // 마지막 스토리 저장
  if (currentStory && currentStory.title) {
    if (currentOutcome && outcomeLines.length > 0) {
      currentOutcome.results = outcomeLines;
      currentStory.outcomes!.push(currentOutcome as StoryOutcome);
    }
    if (descriptionLines.length > 0) {
      currentStory.description = descriptionLines.join(' ').trim();
    }
    stories.push(currentStory as ParsedStory);
  }

  return stories;
}

export async function importRandomStories(filePath: string) {
  console.log('📚 랜덤 스토리 파싱 시작...');
  
  const stories = parseStoryFile(filePath);
  console.log(`✅ ${stories.length}개 스토리 파싱 완료`);

  console.log('💾 데이터베이스에 저장 중...');
  
  let successCount = 0;
  for (const story of stories) {
    try {
      await prisma.randomStory.create({
        data: {
          title: story.title,
          description: story.description,
          choices: JSON.stringify(story.choices),
          outcomes: JSON.stringify(story.outcomes),
          category: story.category || 'random_encounter'
        }
      });
      successCount++;
    } catch (error) {
      console.error(`❌ 스토리 "${story.title}" 저장 실패:`, error);
    }
  }

  console.log(`✅ ${successCount}개 스토리 데이터베이스 저장 완료`);
}

// 직접 실행 시
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('사용법: ts-node parseRandomStories.ts <파일경로>');
    process.exit(1);
  }

  importRandomStories(filePath)
    .then(() => {
      console.log('🎉 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 오류:', error);
      process.exit(1);
    });
}

