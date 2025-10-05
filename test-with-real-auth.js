const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testWithRealAuth() {
  try {
    console.log('🔍 실제 인증으로 테스트...');
    
    // 1. 로그인 API 호출
    console.log('\n1️⃣ 로그인...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    console.log(`로그인 응답 상태: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ 로그인 실패:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ 로그인 성공, 토큰 받음');
    
    // 2. 게임 시작 API 호출
    console.log('\n2️⃣ 게임 시작...');
    const gameResponse = await fetch('http://localhost:5000/api/story/day/1/enter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`게임 시작 응답 상태: ${gameResponse.status}`);
    
    if (gameResponse.ok) {
      const gameData = await gameResponse.json();
      console.log('\n📋 게임 시작 응답:');
      console.log(JSON.stringify(gameData, null, 2));
      
      // startNode 상세 확인
      if (gameData.startNode) {
        console.log('\n✅ startNode 상세:');
        console.log(`  - nodeId: ${gameData.startNode.nodeId}`);
        console.log(`  - text 길이: ${gameData.startNode.text?.length}자`);
        console.log(`  - choices 개수: ${gameData.startNode.choices?.length || 0}개`);
        
        if (gameData.startNode.choices && gameData.startNode.choices.length > 0) {
          console.log('  - choices 내용:');
          gameData.startNode.choices.forEach((choice, index) => {
            console.log(`    ${index + 1}. ${choice.label || choice.text || '선택지'}`);
          });
        }
      } else {
        console.log('\n❌ startNode가 없습니다!');
        
        // DB에서 직접 확인
        console.log('\n🔍 DB에서 직접 확인...');
        const tutorialNode = await prisma.mainStory.findUnique({
          where: { node_id: 200 }
        });
        
        if (tutorialNode) {
          console.log('✅ 튜토리얼 노드 200번 존재:');
          console.log(`  - 제목: ${tutorialNode.title}`);
          console.log(`  - 텍스트: ${tutorialNode.text.substring(0, 100)}...`);
          console.log(`  - choices: ${tutorialNode.choices}`);
        } else {
          console.log('❌ 튜토리얼 노드 200번 없음');
        }
      }
      
    } else {
      const errorData = await gameResponse.json();
      console.log('❌ 게임 시작 실패:', errorData);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithRealAuth();
