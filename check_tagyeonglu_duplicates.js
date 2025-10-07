const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTagyeongluDuplicates() {
  try {
    console.log('🔍 태영루 선택지 중복 확인 중...\n');
    
    // "태영루" 관련 선택지들 찾기
    const tagyeongluChoices = await prisma.$queryRaw`
      SELECT c.id, c.choice_text, c.order_num,
             s.node_id as source_node_id, s.title as source_title,
             t.node_id as target_node_id, t.title as target_title
      FROM choices c
      JOIN nodes s ON c.from_node_id = s.id
      JOIN nodes t ON c.to_node_id = t.id
      WHERE c.choice_text LIKE '%태영루%'
      ORDER BY s.node_id, c.order_num
    `;
    
    console.log(`📋 "태영루" 관련 선택지들 (${tagyeongluChoices.length}개):`);
    tagyeongluChoices.forEach((choice, index) => {
      console.log(`${index + 1}. Node ${choice.source_node_id} ("${choice.source_title}")`);
      console.log(`   → "${choice.choice_text}"`);
      console.log(`   → Node ${choice.target_node_id} ("${choice.target_title}")`);
      console.log(`   → Choice ID: ${choice.id}, Order: ${choice.order_num}`);
      console.log('');
    });
    
    // 노드 33, 34의 선택지들 확인
    console.log('📋 노드 33 선택지들:');
    const node33Choices = await prisma.$queryRaw`
      SELECT c.id, c.choice_text, c.order_num, t.node_id as target_node_id, t.title as target_title
      FROM choices c
      JOIN nodes s ON c.from_node_id = s.id
      JOIN nodes t ON c.to_node_id = t.id
      WHERE s.node_id = 33
      ORDER BY c.order_num
    `;
    
    node33Choices.forEach((choice, index) => {
      console.log(`   ${index + 1}. "${choice.choice_text}" → Node ${choice.target_node_id} ("${choice.target_title}")`);
    });
    
    console.log('\n📋 노드 34 선택지들:');
    const node34Choices = await prisma.$queryRaw`
      SELECT c.id, c.choice_text, c.order_num, t.node_id as target_node_id, t.title as target_title
      FROM choices c
      JOIN nodes s ON c.from_node_id = s.id
      JOIN nodes t ON c.to_node_id = t.id
      WHERE s.node_id = 34
      ORDER BY c.order_num
    `;
    
    node34Choices.forEach((choice, index) => {
      console.log(`   ${index + 1}. "${choice.choice_text}" → Node ${choice.target_node_id} ("${choice.target_title}")`);
    });
    
    // 중복 확인
    console.log('\n🔍 중복 확인:');
    const sourceNodes = {};
    tagyeongluChoices.forEach(choice => {
      const sourceNodeId = choice.source_node_id;
      if (!sourceNodes[sourceNodeId]) {
        sourceNodes[sourceNodeId] = [];
      }
      sourceNodes[sourceNodeId].push(choice);
    });
    
    Object.keys(sourceNodes).forEach(sourceNodeId => {
      const choices = sourceNodes[sourceNodeId];
      if (choices.length > 1) {
        console.log(`❌ 노드 ${sourceNodeId}에 태영루 선택지가 ${choices.length}개 중복됨:`);
        choices.forEach(choice => {
          console.log(`   - Choice ID ${choice.id}: "${choice.choice_text}"`);
        });
      } else {
        console.log(`✅ 노드 ${sourceNodeId}: 태영루 선택지 1개 (정상)`);
      }
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTagyeongluDuplicates();
