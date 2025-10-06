"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASSAGE_TO_NODE_ID = void 0;
exports.parseRequirement = parseRequirement;
exports.parseRewards = parseRewards;
exports.PASSAGE_TO_NODE_ID = {
    '시작 노드 (선택지 3개)': 300,
    '루트 1': 400,
    '루트 1-1. 정보 파는 사람': 410,
    '루트 1-2. 무장 강도': 420,
    '루트 2': 500,
    '루트 2-1. 쫓기는 학생': 510,
    '루트 2-2. 수상한 테러범': 520,
    '루트 3': 600,
    '루트 3-1. 부상 당한 미군': 610,
    '루트 3-2. 사기꾼': 620,
};
function parseRequirement(text) {
    const abilityMatch = text.match(/\[([가-힣\s]+)\s+Lv\.(\d+)\]/);
    if (abilityMatch) {
        return {
            type: 'ability',
            name: abilityMatch[1].trim(),
            level: parseInt(abilityMatch[2])
        };
    }
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
function parseRewards(text) {
    const rewards = {};
    const hpMatch = text.match(/체력\s*([+-]\d+)/);
    if (hpMatch)
        rewards.hp = parseInt(hpMatch[1]) * 33.33;
    const energyMatch = text.match(/멘탈\s*([+-]\d+)|정신\s*([+-]\d+)/);
    if (energyMatch)
        rewards.energy = parseInt(energyMatch[1] || energyMatch[2]) * 33.33;
    const goldMatch = text.match(/돈\s*([+-]\d+)/);
    if (goldMatch)
        rewards.gold = parseInt(goldMatch[1]);
    return rewards;
}
//# sourceMappingURL=parseMainStory.js.map