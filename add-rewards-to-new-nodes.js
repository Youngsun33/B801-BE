const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRewardsToNewNodes() {
  console.log('🎁 새 노드들의 보상/페널티 추가 중...\n');

  try {
    // 리소스 맵 생성
    const resources = await prisma.$queryRaw`SELECT id, name FROM resources`;
    const resourceMap = {};
    resources.forEach(r => {
      resourceMap[r.name] = r.id;
    });

    console.log('📋 리소스 맵:');
    Object.keys(resourceMap).forEach(name => {
      console.log(`  ${name}: ${resourceMap[name]}`);
    });

    // 새로 추가된 노드들 확인
    const newNodes = await prisma.$queryRaw`
      SELECT id, node_id, title, text_content FROM nodes 
      WHERE story_id = 1 AND node_id >= 98 AND node_id <= 108
      ORDER BY node_id
    `;

    console.log('\n📄 새 노드들:');
    newNodes.forEach(node => {
      console.log(`  노드 ${node.node_id}: ${node.title}`);
    });

    // choice_results에 추가할 보상들
    const rewardsToAdd = [
      // 현재 새로 추가한 노드들에는 () 보상이 없는 것 같지만
      // 나중에 추가될 노드들을 위해 구조 확인
    ];

    // 기존 choice_results 확인
    const existingResults = await prisma.$queryRaw`
      SELECT cr.*, c.choice_text, n1.node_id as from_node, n2.node_id as to_node
      FROM choice_results cr
      JOIN choices c ON cr.choice_id = c.id
      JOIN nodes n1 ON c.from_node_id = n1.id
      JOIN nodes n2 ON c.to_node_id = n2.id
      WHERE n1.story_id = 1 AND (n1.node_id >= 98 OR n2.node_id >= 98)
    `;

    console.log('\n🎯 새 노드 관련 기존 choice_results:');
    if (existingResults.length === 0) {
      console.log('  아직 없음');
    } else {
      existingResults.forEach(result => {
        console.log(`  ${result.from_node} → ${result.to_node}: ${result.result_type} ${result.value_change}`);
      });
    }

    // 게임 실력 Lv.2 제약조건이 있는 선택지 확인
    const gameSkillChoices = await prisma.$queryRaw`
      SELECT c.id, c.choice_text, n1.node_id as from_node, n2.node_id as to_node
      FROM choices c
      JOIN nodes n1 ON c.from_node_id = n1.id
      JOIN nodes n2 ON c.to_node_id = n2.id
      JOIN choice_constraints cc ON c.id = cc.choice_id
      JOIN resources r ON cc.resource_id = r.id
      WHERE n1.story_id = 1 AND r.name = '게임 실력' AND cc.required_value = 2
    `;

    console.log('\n🎮 게임 실력 Lv.2 제약조건이 있는 선택지:');
    gameSkillChoices.forEach(choice => {
      console.log(`  ${choice.from_node} → ${choice.to_node}: ${choice.choice_text}`);
    });

    // 만약 게임 실력 Lv.2 선택지를 선택했을 때 보상이 없다면 추가
    if (gameSkillChoices.length > 0) {
      for (const choice of gameSkillChoices) {
        const existingReward = await prisma.$queryRaw`
          SELECT * FROM choice_results 
          WHERE choice_id = ${choice.id}
        `;

        if (existingReward.length === 0) {
          console.log(`\n➕ 게임 실력 Lv.2 선택지에 보상 추가: ${choice.from_node} → ${choice.to_node}`);
          
          // 게임 실력을 선택하면 돈이나 다른 보상이 있을 수 있음
          // 예: 돈 +1 보상 추가
          if (resourceMap['돈']) {
            await prisma.$executeRaw`
              INSERT INTO choice_results (choice_id, resource_id, result_type, value_change, description)
              VALUES (${choice.id}, ${resourceMap['돈']}, 'STAT', 1, '게임 실력으로 승리한 보상')
            `;
            console.log(`  ✓ 돈 +1 보상 추가`);
          }
        }
      }
    }

    console.log('\n✅ 새 노드 보상/페널티 확인 완료!');
    console.log('\n📝 참고:');
    console.log('  - 현재 새로 추가한 노드들(98~108)에는 () 보상이 없음');
    console.log('  - 게임 실력 Lv.2 선택지에 돈 보상 추가됨');
    console.log('  - 나중에 추가될 노드들에 () 보상이 있다면 choice_results에 추가 필요');

  } catch (error) {
    console.error('❌ 오류:', error);
    throw error;
  }
}

addRewardsToNewNodes()
  .catch(e => {
    console.error('실행 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
