const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStoryFlow() {
  try {
    console.log('🔍 스토리 연결성 확인 중...');
    
    // 모든 노드와 선택지 가져오기
    const nodes = await prisma.mainStory.findMany({
      select: {
        node_id: true,
        title: true,
        node_type: true
      },
      orderBy: { node_id: 'asc' }
    });
    
    const choices = await prisma.storyChoice.findMany({
      select: {
        id: true,
        story_node_id: true,
        choice_text: true,
        target_node_id: true
      },
      orderBy: [
        { story_node_id: 'asc' },
        { order_index: 'asc' }
      ]
    });
    
    console.log('\n📋 노드 목록:');
    console.table(nodes);
    
    console.log('\n🔗 선택지 연결:');
    console.table(choices);
    
    // 연결성 검사
    console.log('\n🔍 연결성 검사:');
    
    const nodeIds = new Set(nodes.map(n => n.node_id));
    const targetNodeIds = new Set(choices.map(c => c.target_node_id));
    
    // 도달 불가능한 노드 찾기
    const unreachableNodes = [];
    for (const nodeId of nodeIds) {
      if (nodeId === 1) continue; // 시작 노드는 제외
      
      const hasIncoming = choices.some(c => c.target_node_id === nodeId);
      if (!hasIncoming) {
        unreachableNodes.push(nodeId);
      }
    }
    
    if (unreachableNodes.length > 0) {
      console.log('❌ 도달 불가능한 노드들:', unreachableNodes);
    } else {
      console.log('✅ 모든 노드에 도달 가능');
    }
    
    // 존재하지 않는 타겟 노드 찾기
    const invalidTargets = [];
    for (const choice of choices) {
      if (!nodeIds.has(choice.target_node_id)) {
        invalidTargets.push({
          choiceId: choice.id,
          fromNode: choice.story_node_id,
          invalidTarget: choice.target_node_id,
          text: choice.choice_text
        });
      }
    }
    
    if (invalidTargets.length > 0) {
      console.log('❌ 존재하지 않는 타겟 노드들:');
      console.table(invalidTargets);
    } else {
      console.log('✅ 모든 선택지의 타겟 노드가 존재');
    }
    
    // 스토리 플로우 추적
    console.log('\n📖 스토리 플로우 추적:');
    const visited = new Set();
    const flow = [];
    
    function traceFlow(nodeId, depth = 0) {
      if (visited.has(nodeId) || depth > 20) return; // 무한 루프 방지
      
      visited.add(nodeId);
      const node = nodes.find(n => n.node_id === nodeId);
      if (node) {
        flow.push({
          depth,
          nodeId,
          title: node.title,
          type: node.node_type
        });
        
        const nodeChoices = choices.filter(c => c.story_node_id === nodeId);
        for (const choice of nodeChoices) {
          traceFlow(choice.target_node_id, depth + 1);
        }
      }
    }
    
    traceFlow(1); // 시작 노드부터 추적
    
    console.table(flow);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStoryFlow();
