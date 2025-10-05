// Node.js 18+ 내장 fetch 사용

async function testAPI() {
  try {
    console.log('🔍 API 테스트 시작...');
    
    // 1. 서버 상태 확인
    console.log('\n1️⃣ 서버 상태 확인...');
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ 서버 정상 작동 중');
      } else {
        console.log(`❌ 서버 응답 오류: ${response.status}`);
        const errorText = await response.text();
        console.log('에러 내용:', errorText);
      }
    } catch (error) {
      console.log('❌ 서버 연결 실패:', error.message);
      return;
    }
    
    // 2. 게임 시작 API 테스트 (인증 없이)
    console.log('\n2️⃣ 게임 시작 API 테스트...');
    try {
      const response = await fetch('http://localhost:5000/api/story/day/1/enter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`응답 상태: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 게임 시작 성공:', data);
      } else {
        const errorData = await response.json();
        console.log('❌ 게임 시작 실패:', errorData);
      }
    } catch (error) {
      console.log('❌ 게임 시작 API 오류:', error.message);
    }
    
    // 3. 로그인 API 테스트
    console.log('\n3️⃣ 로그인 API 테스트...');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      });
      
      console.log(`로그인 응답 상태: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 로그인 성공:', data.accessToken ? '토큰 발급됨' : '토큰 없음');
        
        // 4. 인증된 상태로 게임 시작 테스트
        console.log('\n4️⃣ 인증된 상태로 게임 시작 테스트...');
        const gameResponse = await fetch('http://localhost:5000/api/story/day/1/enter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.accessToken}`
          }
        });
        
        console.log(`게임 시작 응답 상태: ${gameResponse.status}`);
        
        if (gameResponse.ok) {
          const gameData = await gameResponse.json();
          console.log('✅ 인증된 게임 시작 성공:', gameData);
        } else {
          const errorData = await gameResponse.json();
          console.log('❌ 인증된 게임 시작 실패:', errorData);
        }
      } else {
        const errorData = await response.json();
        console.log('❌ 로그인 실패:', errorData);
      }
    } catch (error) {
      console.log('❌ 로그인 API 오류:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 전체 테스트 오류:', error);
  }
}

testAPI();
