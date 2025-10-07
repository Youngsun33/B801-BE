"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStoryFile = parseStoryFile;
exports.importRandomStories = importRandomStories;
const fs = __importStar(require("fs"));
const prisma_1 = require("./prisma");
function parseRequirement(text) {
    const match = text.match(/\(([^)]+)\)/);
    if (!match)
        return null;
    const content = match[1];
    const levelMatch = content.match(/(.+?)\s*Lv\.(\d+)/i);
    if (levelMatch) {
        return { skill: levelMatch[1].trim(), level: parseInt(levelMatch[2]) };
    }
    const items = ['권총', '물', '식량', '돈', '생수', '우비', '살충제', '강아지', '손전등'];
    if (items.includes(content)) {
        return { item: content };
    }
    return { skill: content };
}
function parseRewards(text) {
    const rewards = [];
    const mentalMatch = text.match(/멘탈\s*([+-]\d+)/);
    if (mentalMatch) {
        rewards.push({
            stat: 'energy',
            value: parseInt(mentalMatch[1]) * 33.33
        });
    }
    const statMatches = text.matchAll(/(체력|관찰력|근력|민첩함|은신술|손재주|언변술|매력|직감|사격술|게임 실력|생태 지식|요리 실력|응급처치|기계공학|영어|선행|악행)\s*([+-])\s*(\d+)/g);
    for (const match of statMatches) {
        rewards.push({
            stat: match[1],
            value: parseInt(match[3]) * (match[2] === '+' ? 1 : -1)
        });
    }
    const itemMatches = text.matchAll(/(돈|식량|물|생수|진통제|의약품|우비|붕대|권총|총)\s*\+(\d+)/g);
    for (const match of itemMatches) {
        rewards.push({
            item: match[1],
            quantity: parseInt(match[2])
        });
    }
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
function parseStoryFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const stories = [];
    let currentStory = null;
    let currentSection = null;
    let currentOutcome = null;
    let descriptionLines = [];
    let outcomeLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            if (currentSection === 'description' && descriptionLines.length > 0) {
                currentSection = null;
            }
            continue;
        }
        const storyMatch = line.match(/^(\d+)\.\s*(.+)/);
        if (storyMatch && !line.startsWith('1-') && !line.includes('선택')) {
            if (currentStory && currentStory.title) {
                if (descriptionLines.length > 0) {
                    currentStory.description = descriptionLines.join(' ').trim();
                }
                stories.push(currentStory);
            }
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
        if (line.startsWith('-') && currentStory) {
            const choiceText = line.substring(1).trim();
            if (currentSection === 'outcomes' && choiceText.length > 0) {
                if (currentOutcome) {
                    outcomeLines.push(choiceText);
                }
            }
            else {
                if (currentSection === 'description') {
                    currentStory.description = descriptionLines.join(' ').trim();
                    descriptionLines = [];
                    currentSection = 'choices';
                }
                const requirement = parseRequirement(choiceText);
                const cleanText = choiceText.replace(/\([^)]+\)/g, '').trim();
                currentStory.choices.push({
                    text: cleanText,
                    requirements: requirement || undefined
                });
            }
            continue;
        }
        if (line.startsWith('*') || (currentSection === 'choices' && line.startsWith('-'))) {
            if (currentSection === 'choices') {
                currentSection = 'outcomes';
            }
            if (line.startsWith('*')) {
                if (currentOutcome && outcomeLines.length > 0) {
                    currentOutcome.results = outcomeLines;
                    currentStory.outcomes.push(currentOutcome);
                    outcomeLines = [];
                }
                const resultText = line.substring(1).trim();
                currentOutcome = {
                    choiceText: resultText,
                    results: []
                };
            }
            continue;
        }
        if (currentSection === 'description') {
            descriptionLines.push(line);
        }
        else if (currentSection === 'outcomes' && line.length > 0) {
            outcomeLines.push(line);
        }
    }
    if (currentStory && currentStory.title) {
        if (currentOutcome && outcomeLines.length > 0) {
            currentOutcome.results = outcomeLines;
            currentStory.outcomes.push(currentOutcome);
        }
        if (descriptionLines.length > 0) {
            currentStory.description = descriptionLines.join(' ').trim();
        }
        stories.push(currentStory);
    }
    return stories;
}
async function importRandomStories(filePath) {
    console.log('📚 랜덤 스토리 파싱 시작...');
    const stories = parseStoryFile(filePath);
    console.log(`✅ ${stories.length}개 스토리 파싱 완료`);
    console.log('💾 데이터베이스에 저장 중...');
    let successCount = 0;
    for (const story of stories) {
        try {
            await prisma_1.prisma.randomStory.create({
                data: {
                    title: story.title,
                    description: story.description,
                    choices: JSON.stringify(story.choices),
                    outcomes: JSON.stringify(story.outcomes),
                    category: story.category || 'random_encounter'
                }
            });
            successCount++;
        }
        catch (error) {
            console.error(`❌ 스토리 "${story.title}" 저장 실패:`, error);
        }
    }
    console.log(`✅ ${successCount}개 스토리 데이터베이스 저장 완료`);
}
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
//# sourceMappingURL=parseRandomStories.js.map