const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function debugStartNode() {
  try {
    console.log('🔍 시작 노드 디버깅...');
    
    // testuser로 로그인해서 토큰 받기
    const user = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });
    
    if (!user) {
      console.log('❌ testuser 없음');
      return;
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ 토큰 생성됨');
    
    // fetch로 API 호출
    const response = await fetch('http://localhost:5000/api/story/day/1/enter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`응답 상태: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 API 응답:');
      console.log(JSON.stringify(data, null, 2));
      
      // startNode 상세 확인
      if (data.startNode) {
        console.log('\n✅ startNode 존재:');
        console.log(`  - nodeId: ${data.startNode.nodeId}`);
        console.log(`  - text: ${data.startNode.text?.substring(0, 100)}...`);
        console.log(`  - choices: ${JSON.stringify(data.startNode.choices)}`);
      } else {
        console.log('\n❌ startNode 없음!');
      }
      
      // progress 확인
      if (data.progress) {
        console.log('\n📊 progress 정보:');
        console.log(`  - last_node_id: ${data.progress.last_node_id}`);
        console.log(`  - investigation_count: ${data.progress.investigation_count}`);
      }
    } else {
      const errorData = await response.json();
      console.log('❌ API 오류:', errorData);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStartNode();
