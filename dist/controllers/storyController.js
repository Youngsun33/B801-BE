"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeRandomStoriesAndReturnToCheckpoint = exports.completeRandomStoriesAndSaveCheckpoint = exports.enterStoryDay = exports.autosaveStory = exports.getStoryProgress = exports.getActionPointStatus = exports.getUserResources = exports.chooseStoryOption = exports.getStoryNode = void 0;
const prisma_1 = require("../lib/prisma");
const getStoryNode = async (req, res) => {
    try {
        const { nodeId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        const nodeIdNum = parseInt(nodeId);
        if (isNaN(nodeIdNum)) {
            return res.status(400).json({ error: '유효하지 않은 노드 ID입니다.' });
        }
        const node = await prisma_1.prisma.$queryRaw `
      SELECT * FROM nodes WHERE node_id = ${nodeIdNum}
    `;
        if (!node || node.length === 0) {
            return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
        }
        const nodeData = node[0];
        let nodeText = nodeData.text_content;
        let rewards = undefined;
        if (nodeIdNum === 5) {
            nodeText = nodeData.text_content + '\n(돈 +1)';
        }
        if (nodeIdNum === 4) {
            console.log('⚠️ 노드 4 직접 조회 - 세션 데이터 확인');
            const session = await prisma_1.prisma.$queryRaw `
        SELECT temp_data FROM investigation_sessions 
        WHERE user_id = ${userId} AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
      `;
            let userAbilities = [];
            if (session.length > 0 && session[0].temp_data) {
                try {
                    const tempData = JSON.parse(session[0].temp_data);
                    if (tempData.node4Abilities) {
                        userAbilities = tempData.node4Abilities;
                        console.log('   → 세션에서 능력 로드:', userAbilities.map((a) => a.name));
                    }
                }
                catch (e) {
                    console.error('temp_data 파싱 실패:', e);
                }
            }
            if (userAbilities.length === 0) {
                userAbilities = await prisma_1.prisma.$queryRaw `
          SELECT ur.id, ur.quantity, r.name, r.description
          FROM user_resources ur
          JOIN resources r ON ur.resource_id = r.id
          WHERE ur.user_id = ${userId} AND r.type = 'SKILL'
          AND r.name IN ('관찰력', '근력', '민첩함', '은신술', '손재주', '언변술', '매력', '직감', '권총')
          ORDER BY ur.id DESC
          LIMIT 2
        `;
                console.log('   → DB에서 최근 능력:', userAbilities.map((a) => a.name));
            }
            if (userAbilities.length > 0) {
                const abilityText = userAbilities.map((a) => `+ ${a.name}\n${a.description}`).join('\n\n');
                nodeText = `당신이 가진 능력이 깨어났습니다...\n\n이제 얻은 능력\n\n${abilityText}`;
                rewards = {
                    abilities: userAbilities.map((a) => ({
                        name: a.name,
                        description: a.description
                    }))
                };
            }
        }
        const choices = await prisma_1.prisma.$queryRaw `
      SELECT c.*, n.node_id as target_node_number
      FROM choices c
      JOIN nodes n ON c.to_node_id = n.id
      WHERE c.from_node_id = ${nodeData.id}
      ORDER BY c.order_num ASC
    `;
        const choicesWithConstraints = await Promise.all(choices.map(async (choice) => {
            const constraints = await prisma_1.prisma.$queryRaw `
          SELECT cc.*, r.name as resource_name, r.type as resource_type
          FROM choice_constraints cc
          JOIN resources r ON cc.resource_id = r.id
          WHERE cc.choice_id = ${choice.id}
        `;
            return {
                id: choice.id,
                targetNodeId: choice.target_node_number,
                label: choice.choice_text,
                available: choice.is_available,
                requirements: constraints.map((c) => ({
                    type: c.resource_type,
                    name: c.resource_name,
                    value: c.required_value,
                    operator: c.comparison_type
                }))
            };
        }));
        const activeSession = await prisma_1.prisma.$queryRaw `
      SELECT hp, energy, gold_start FROM investigation_sessions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        const sessionInfo = activeSession.length > 0 ? {
            hp: activeSession[0].hp,
            energy: activeSession[0].energy,
            gold: activeSession[0].gold_start
        } : null;
        return res.status(200).json({
            nodeId: nodeData.node_id,
            title: nodeData.title,
            text: nodeText,
            nodeType: nodeData.node_type,
            choices: choicesWithConstraints,
            rewards,
            session: sessionInfo
        });
    }
    catch (error) {
        console.error('노드 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getStoryNode = getStoryNode;
const chooseStoryOption = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { choiceId } = req.body;
        if (!userId) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        if (!choiceId) {
            return res.status(400).json({ error: 'choiceId가 필요합니다.' });
        }
        const choices = await prisma_1.prisma.$queryRaw `
      SELECT * FROM choices WHERE id = ${choiceId}
    `;
        if (!choices || choices.length === 0) {
            return res.status(404).json({ error: '선택지를 찾을 수 없습니다.' });
        }
        const choice = choices[0];
        const constraints = await prisma_1.prisma.$queryRaw `
      SELECT cc.*, r.name, r.type 
      FROM choice_constraints cc
      JOIN resources r ON cc.resource_id = r.id
      WHERE cc.choice_id = ${choiceId}
    `;
        for (const constraint of constraints) {
            let currentValue = 0;
            if (constraint.type === 'STAT') {
                const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    if (constraint.name === '돈') {
                        currentValue = user.gold;
                    }
                    else if (constraint.name === '체력') {
                        currentValue = user.hp;
                    }
                    else if (constraint.name === '정신력' || constraint.name === '에너지') {
                        currentValue = user.energy;
                    }
                }
            }
            else {
                const userResources = await prisma_1.prisma.$queryRaw `
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${constraint.resource_id}
        `;
                currentValue = userResources[0]?.quantity || 0;
            }
            let isValid = false;
            switch (constraint.comparison_type) {
                case '>=':
                    isValid = currentValue >= constraint.required_value;
                    break;
                case '<=':
                    isValid = currentValue <= constraint.required_value;
                    break;
                case '==':
                    isValid = currentValue === constraint.required_value;
                    break;
                case '>':
                    isValid = currentValue > constraint.required_value;
                    break;
                case '<':
                    isValid = currentValue < constraint.required_value;
                    break;
                default:
                    isValid = currentValue >= constraint.required_value;
            }
            console.log(`제약조건 확인: ${constraint.name} (${constraint.type}) - 필요: ${constraint.required_value}, 보유: ${currentValue}, 결과: ${isValid}`);
            if (!isValid) {
                return res.status(400).json({
                    error: `요구사항 미충족: ${constraint.name} (필요: ${constraint.required_value}, 보유: ${currentValue})`
                });
            }
        }
        const results = await prisma_1.prisma.$queryRaw `
      SELECT cr.*, r.name, r.type 
      FROM choice_results cr
      JOIN resources r ON cr.resource_id = r.id
      WHERE cr.choice_id = ${choiceId}
    `;
        const delta = {};
        for (const result of results) {
            console.log('결과 적용:', result.name, result.value_change);
            if (result.type === 'STAT') {
                const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    if (result.name === '돈') {
                        const newGold = user.gold + result.value_change;
                        await prisma_1.prisma.$executeRaw `
              UPDATE users SET gold = ${newGold} WHERE id = ${userId}
            `;
                        delta.gold = result.value_change;
                        console.log('돈 업데이트:', user.gold, '→', newGold);
                    }
                    else if (result.name === '체력') {
                        const session = await prisma_1.prisma.$queryRaw `
              SELECT hp FROM investigation_sessions 
              WHERE user_id = ${userId} AND status = 'active'
              LIMIT 1
            `;
                        const currentHp = session.length > 0 ? session[0].hp : 3;
                        const newHp = Math.max(0, Math.min(3, currentHp + result.value_change));
                        await prisma_1.prisma.$executeRaw `
              UPDATE investigation_sessions 
              SET hp = ${newHp}
              WHERE user_id = ${userId} AND status = 'active'
            `;
                        await prisma_1.prisma.$executeRaw `
              UPDATE users 
              SET hp = ${newHp}
              WHERE id = ${userId}
            `;
                        delta.hp = result.value_change;
                        console.log('체력 업데이트:', currentHp, '→', newHp, '(변화:', result.value_change, ')');
                        if (newHp <= 0) {
                            delta.sessionEnded = true;
                            delta.endReason = 'hp_depleted';
                            await prisma_1.prisma.$executeRaw `
                UPDATE investigation_sessions 
                SET status = 'completed', ended_at = CURRENT_TIMESTAMP, hp = 0
                WHERE user_id = ${userId} AND status = 'active'
              `;
                            console.log('체력 소진 - 조사 종료');
                        }
                    }
                    else if (result.name === '정신력' || result.name === '에너지') {
                        const session = await prisma_1.prisma.$queryRaw `
              SELECT energy FROM investigation_sessions 
              WHERE user_id = ${userId} AND status = 'active'
              LIMIT 1
            `;
                        const currentEnergy = session.length > 0 ? session[0].energy : 3;
                        const newEnergy = Math.max(0, Math.min(3, currentEnergy + result.value_change));
                        await prisma_1.prisma.$executeRaw `
              UPDATE investigation_sessions 
              SET energy = ${newEnergy}
              WHERE user_id = ${userId} AND status = 'active'
            `;
                        await prisma_1.prisma.$executeRaw `
              UPDATE users 
              SET energy = ${newEnergy}
              WHERE id = ${userId}
            `;
                        delta.energy = result.value_change;
                        console.log('정신력 업데이트:', currentEnergy, '→', newEnergy, '(변화:', result.value_change, ')');
                        if (newEnergy <= 0) {
                            delta.sessionEnded = true;
                            delta.endReason = 'energy_depleted';
                            await prisma_1.prisma.$executeRaw `
                UPDATE investigation_sessions 
                SET status = 'completed', ended_at = CURRENT_TIMESTAMP, energy = 0
                WHERE user_id = ${userId} AND status = 'active'
              `;
                            console.log('정신력 소진 - 조사 종료');
                        }
                    }
                }
            }
            else {
                const userResources = await prisma_1.prisma.$queryRaw `
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${result.resource_id}
        `;
                if (userResources.length > 0) {
                    const newQuantity = userResources[0].quantity + result.value_change;
                    await prisma_1.prisma.$executeRaw `
            UPDATE user_resources 
            SET quantity = ${newQuantity}
            WHERE user_id = ${userId} AND resource_id = ${result.resource_id}
          `;
                }
                else {
                    await prisma_1.prisma.$executeRaw `
            INSERT INTO user_resources (user_id, resource_id, quantity)
            VALUES (${userId}, ${result.resource_id}, ${result.value_change})
          `;
                }
                if (result.type === 'ITEM') {
                    if (!delta.items)
                        delta.items = [];
                    delta.items.push({
                        name: result.name,
                        qty: result.value_change
                    });
                }
                else if (result.type === 'SKILL') {
                    if (!delta.abilities)
                        delta.abilities = [];
                    delta.abilities.push({
                        name: result.name,
                        description: result.description || ''
                    });
                }
                delta[result.name] = result.value_change;
            }
        }
        const nextNodeId = choice.to_node_id;
        const nextNodes = await prisma_1.prisma.$queryRaw `
      SELECT * FROM nodes WHERE id = ${nextNodeId}
    `;
        const nextNode = nextNodes[0];
        if (nextNode && nextNode.node_id === 4) {
            console.log('노드 4 도착 - 랜덤 능력 부여 (중복 가능)');
            const basicAbilities = await prisma_1.prisma.$queryRaw `
        SELECT * FROM resources 
        WHERE type = 'SKILL' 
        AND name IN ('관찰력', '근력', '민첩함', '은신술', '손재주', '언변술', '매력', '직감', '권총')
        ORDER BY id
      `;
            const shuffled = [...basicAbilities].sort(() => 0.5 - Math.random());
            const selectedAbilities = shuffled.slice(0, 2);
            for (const ability of selectedAbilities) {
                const existing = await prisma_1.prisma.$queryRaw `
          SELECT * FROM user_resources 
          WHERE user_id = ${userId} AND resource_id = ${ability.id}
        `;
                if (existing.length > 0) {
                    await prisma_1.prisma.$executeRaw `
            UPDATE user_resources 
            SET quantity = quantity + 1
            WHERE user_id = ${userId} AND resource_id = ${ability.id}
          `;
                }
                else {
                    await prisma_1.prisma.$executeRaw `
            INSERT INTO user_resources (user_id, resource_id, quantity)
            VALUES (${userId}, ${ability.id}, 1)
          `;
                }
            }
            delta.abilities = selectedAbilities.map(a => ({
                name: a.name,
                description: a.description
            }));
            const tempData = JSON.stringify({
                node4Abilities: selectedAbilities.map(a => ({
                    id: a.id,
                    name: a.name,
                    description: a.description
                }))
            });
            await prisma_1.prisma.$executeRaw `
        UPDATE investigation_sessions 
        SET current_node_id = 4, temp_data = ${tempData}
        WHERE user_id = ${userId} AND status = 'active'
      `;
            console.log('=== 노드 4 능력 부여 ===');
            console.log('선택된 능력:', selectedAbilities.map(a => a.name));
            console.log('세션에 저장됨');
            console.log('delta.abilities:', delta.abilities);
        }
        if (nextNode && nextNode.node_id === 5) {
            console.log('노드 5 도착 - 돈 +1');
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                const newGold = user.gold + 1;
                await prisma_1.prisma.$executeRaw `
          UPDATE users SET gold = ${newGold} WHERE id = ${userId}
        `;
                delta.gold = 1;
                console.log('돈 업데이트:', user.gold, '→', newGold);
            }
        }
        if (nextNode && nextNode.node_type === 'ending') {
            console.log(`엔딩 노드 ${nextNode.node_id} 도착`);
            delta.ending = {
                title: nextNode.title,
                message: '엔딩에 도달했습니다. 체크포인트에서 다시 시작할 수 있습니다.'
            };
            await prisma_1.prisma.$executeRaw `
        UPDATE investigation_sessions 
        SET status = 'completed', ended_at = CURRENT_TIMESTAMP, hp = 0, energy = 0
        WHERE user_id = ${userId} AND status = 'active'
      `;
            delta.sessionEnded = true;
            delta.endReason = 'ending';
        }
        if (nextNode && (nextNode.node_type === 'checkpoint')) {
            console.log(`체크포인트 노드 ${nextNode.node_id} 도착 - 저장`);
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                const existing = await prisma_1.prisma.$queryRaw `
          SELECT * FROM user_checkpoints 
          WHERE user_id = ${userId} AND node_id = ${nextNode.node_id}
        `;
                if (existing.length === 0) {
                    const checkpointInfo = await prisma_1.prisma.$queryRaw `
            SELECT checkpoint_name, description 
            FROM checkpoints 
            WHERE node_id = ${nextNode.id}
          `;
                    let checkpointTitle = nextNode.title || `체크포인트 ${nextNode.node_id}`;
                    let checkpointDesc = nextNode.text_content.substring(0, 100);
                    if (checkpointInfo.length > 0) {
                        checkpointTitle = checkpointInfo[0].checkpoint_name;
                        checkpointDesc = checkpointInfo[0].description || checkpointDesc;
                    }
                    await prisma_1.prisma.$executeRaw `
            INSERT INTO user_checkpoints (user_id, node_id, title, description, hp, energy, gold)
            VALUES (
              ${userId}, 
              ${nextNode.node_id}, 
              ${checkpointTitle},
              ${checkpointDesc},
              ${user.hp},
              ${user.energy},
              ${user.gold}
            )
          `;
                    delta.checkpoint = {
                        title: checkpointTitle,
                        message: '체크포인트 도달! 진행 상황이 저장되었습니다.'
                    };
                    console.log(`체크포인트 저장 완료: ${checkpointTitle}`);
                }
                else {
                    console.log('이미 저장된 체크포인트입니다.');
                }
            }
        }
        let nextNodeData = null;
        if (nextNode) {
            let nextNodeText = nextNode.text_content;
            if (nextNode.node_id === 5) {
                nextNodeText = nextNode.text_content + '\n(돈 +1)';
            }
            if (nextNode.node_id === 4 && delta.abilities) {
                console.log('=== 노드 4 텍스트 생성 ===');
                console.log('delta.abilities:', JSON.stringify(delta.abilities, null, 2));
                const abilityText = delta.abilities.map((a) => `+ ${a.name}\n${a.description}`).join('\n\n');
                nextNodeText = `당신이 가진 능력이 깨어났습니다...\n\n이제 얻은 능력\n\n${abilityText}`;
                console.log('생성된 텍스트:', nextNodeText);
            }
            const nextChoices = await prisma_1.prisma.$queryRaw `
        SELECT c.*, n.node_id as target_node_number
        FROM choices c
        JOIN nodes n ON c.to_node_id = n.id
        WHERE c.from_node_id = ${nextNode.id}
        ORDER BY c.order_num ASC
      `;
            const nextChoicesFormatted = nextChoices.map((c) => ({
                id: c.id,
                targetNodeId: c.target_node_number,
                label: c.choice_text,
                available: c.is_available
            }));
            nextNodeData = {
                nodeId: nextNode.node_id,
                title: nextNode.title,
                text: nextNodeText,
                nodeType: nextNode.node_type,
                choices: nextChoicesFormatted
            };
        }
        const updatedSession = await prisma_1.prisma.$queryRaw `
      SELECT hp, energy, gold_start FROM investigation_sessions 
      WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 1
    `;
        const sessionInfo = updatedSession.length > 0 ? {
            hp: updatedSession[0].hp,
            energy: updatedSession[0].energy,
            gold: updatedSession[0].gold_start
        } : null;
        return res.status(200).json({
            success: true,
            delta,
            nodeId: nextNode ? nextNode.node_id : null,
            nextNode: nextNodeData,
            session: sessionInfo
        });
    }
    catch (error) {
        console.error('선택지 선택 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.chooseStoryOption = chooseStoryOption;
const getUserResources = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }
        const resources = await prisma_1.prisma.$queryRaw `
      SELECT ur.*, r.name, r.description, r.type
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId}
      ORDER BY r.type, r.name
    `;
        return res.status(200).json({ resources });
    }
    catch (error) {
        console.error('사용자 자원 조회 오류:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserResources = getUserResources;
const getActionPointStatus = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 investigation 시스템으로 이전되었습니다.' });
};
exports.getActionPointStatus = getActionPointStatus;
const getStoryProgress = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 investigation 시스템으로 이전되었습니다.' });
};
exports.getStoryProgress = getStoryProgress;
const autosaveStory = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};
exports.autosaveStory = autosaveStory;
const enterStoryDay = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};
exports.enterStoryDay = enterStoryDay;
const completeRandomStoriesAndSaveCheckpoint = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};
exports.completeRandomStoriesAndSaveCheckpoint = completeRandomStoriesAndSaveCheckpoint;
const completeRandomStoriesAndReturnToCheckpoint = async (req, res) => {
    return res.status(501).json({ error: '이 기능은 재구현 중입니다.' });
};
exports.completeRandomStoriesAndReturnToCheckpoint = completeRandomStoriesAndReturnToCheckpoint;
//# sourceMappingURL=storyController.js.map