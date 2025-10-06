"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTwinePassage = parseTwinePassage;
exports.parseTwineDocument = parseTwineDocument;
let currentNodeId = 400;
const nodeMapping = new Map();
function isCheckpoint(text) {
    return text.includes('체크 포인트') || text.includes('체크포인트');
}
function extractRouteName(title) {
    if (title.includes('루트 1'))
        return '루트 1';
    if (title.includes('루트 2'))
        return '루트 2';
    if (title.includes('루트 3'))
        return '루트 3';
    return null;
}
function parseChoice(choiceText, nodeIdCounter) {
    const bracketMatch = choiceText.match(/\[\[(.+?)\]\]/);
    if (!bracketMatch) {
        console.warn(`Warning: Invalid choice format, skipping: ${choiceText.substring(0, 50)}`);
        throw new Error(`Invalid choice format: ${choiceText.substring(0, 50)}`);
    }
    const innerText = bracketMatch[1];
    let displayText;
    let targetPassage;
    if (innerText.includes('->')) {
        const parts = innerText.split('->');
        displayText = parts[0].trim();
        targetPassage = parts[1].trim();
    }
    else if (innerText.includes('|')) {
        const parts = innerText.split('|');
        displayText = parts[0].trim();
        targetPassage = parts[1].trim();
    }
    else {
        displayText = innerText.trim();
        targetPassage = innerText.trim();
    }
    return parseChoiceInternal(displayText, targetPassage, nodeIdCounter);
}
function parseChoiceInternal(displayText, targetPassage, nodeIdCounter) {
    let label = displayText;
    let requirement;
    const abilityLevelMatch = label.match(/\[([가-힣\s]+)\s+Lv\.(\d+)\]/);
    if (abilityLevelMatch) {
        requirement = {
            type: 'ability',
            name: abilityLevelMatch[1].trim(),
            level: parseInt(abilityLevelMatch[2])
        };
        label = label.replace(abilityLevelMatch[0], '').trim();
    }
    const simpleAbilityMatch = label.match(/\(([가-힣]+)\)/);
    if (simpleAbilityMatch) {
        requirement = {
            type: 'ability',
            name: simpleAbilityMatch[1],
            level: 1
        };
        label = label.replace(simpleAbilityMatch[0], '').trim();
    }
    let probability;
    const probabilityMatch = label.match(/확률\s+(\d+)%/);
    if (probabilityMatch) {
        probability = parseInt(probabilityMatch[1]);
        label = label.replace(probabilityMatch[0], '').trim();
    }
    label = label.replace(/^-\s*/, '').trim();
    let targetNodeId;
    if (nodeMapping.has(targetPassage)) {
        targetNodeId = nodeMapping.get(targetPassage);
    }
    else {
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
function parseRewards(text) {
    const rewards = {};
    const hpMatch = text.match(/체력\s*([+-]\d+)/);
    if (hpMatch) {
        rewards.hp = parseInt(hpMatch[1]) * 33.33;
    }
    const energyMatch = text.match(/(멘탈|정신)\s*([+-]\d+)/);
    if (energyMatch) {
        rewards.energy = parseInt(energyMatch[2]) * 33.33;
    }
    const goldMatch = text.match(/돈\s*([+-]\d+)/);
    if (goldMatch) {
        rewards.gold = parseInt(goldMatch[1]);
    }
    const abilityMatches = text.matchAll(/([가-힣]+)\s*\+(\d+)/g);
    for (const match of abilityMatches) {
        const abilityName = match[1];
        const value = parseInt(match[2]);
        if (!rewards.abilities)
            rewards.abilities = [];
        rewards.abilities.push({ name: abilityName, value });
    }
    return Object.keys(rewards).length > 0 ? rewards : null;
}
function parseTwinePassage(title, content, nodeIdCounter, positionX, positionY) {
    let nodeId;
    if (nodeMapping.has(title)) {
        nodeId = nodeMapping.get(title);
    }
    else {
        nodeId = nodeIdCounter.value++;
        nodeMapping.set(title, nodeId);
    }
    const lines = content.split('\n').filter(line => line.trim());
    const textLines = [];
    const choiceLines = [];
    for (const line of lines) {
        if (line.includes('[[')) {
            choiceLines.push(line);
        }
        else {
            textLines.push(line);
        }
    }
    const text = textLines.join('\n').trim();
    const choices = choiceLines.map(line => {
        try {
            const choice = parseChoice(line, nodeIdCounter);
            console.log(`    Choice: "${choice.label}" -> node ${choice.targetNodeId}`);
            return choice;
        }
        catch (error) {
            console.error(`    ❌ Failed to parse choice: ${line}`);
            throw error;
        }
    });
    const nodeType = isCheckpoint(text) ? 'checkpoint' : 'main';
    const routeName = extractRouteName(title);
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
function parseTwineDocument(twineContent) {
    const passages = [];
    const nodeIdCounter = { value: 400 };
    nodeMapping.clear();
    const passageRegex = /^:: (.+?)$/gm;
    const matches = [...twineContent.matchAll(passageRegex)];
    console.log('Parsing Twine content, length:', twineContent.length);
    console.log('Found', matches.length, 'passages');
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        let fullTitle = match[1].trim();
        if (fullTitle.startsWith('StoryTitle') || fullTitle.startsWith('StoryData')) {
            continue;
        }
        const title = fullTitle.replace(/\s*\{[^}]+\}\s*$/, '').trim();
        if (!nodeMapping.has(title)) {
            nodeMapping.set(title, nodeIdCounter.value++);
        }
    }
    console.log(`Pre-allocated ${nodeMapping.size} node IDs`);
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        let fullTitle = match[1].trim();
        const startIndex = match.index + match[0].length;
        const endIndex = i < matches.length - 1 ? matches[i + 1].index : twineContent.length;
        const content = twineContent.substring(startIndex, endIndex).trim();
        console.log(`Found passage: "${fullTitle}"`);
        if (fullTitle.startsWith('StoryTitle') || fullTitle.startsWith('StoryData')) {
            console.log(`  -> Skipping metadata`);
            continue;
        }
        let positionX;
        let positionY;
        let title = fullTitle;
        const titlePositionMatch = fullTitle.match(/\{"position":"(\d+),(\d+)"/);
        if (titlePositionMatch) {
            positionX = parseInt(titlePositionMatch[1]);
            positionY = parseInt(titlePositionMatch[2]);
            title = fullTitle.replace(/\s*\{[^}]+\}\s*$/, '').trim();
            console.log(`  -> Position from title: (${positionX}, ${positionY})`);
        }
        else {
            const contentPositionMatch = content.match(/\{"position":"(\d+),(\d+)"\}/);
            if (contentPositionMatch) {
                positionX = parseInt(contentPositionMatch[1]);
                positionY = parseInt(contentPositionMatch[2]);
                console.log(`  -> Position from content: (${positionX}, ${positionY})`);
            }
        }
        const cleanContent = content.replace(/\{"position".+?\}/g, '').trim();
        try {
            console.log(`  Parsing passage "${title}"...`);
            const parsed = parseTwinePassage(title, cleanContent, nodeIdCounter, positionX, positionY);
            passages.push(parsed);
            console.log(`  ✅ Parsed: node_id=${parsed.node_id}, position=(${positionX}, ${positionY}), choices=${parsed.choices}`);
        }
        catch (error) {
            console.error(`  ❌ Error parsing passage "${title}":`, error);
        }
    }
    return passages;
}
//# sourceMappingURL=parseTwineToMainStory.js.map