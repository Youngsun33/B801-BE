# Postman API 테스트 가이드

## 기본 설정
- **Base URL**: `https://b801-be.azurewebsites.net`
- **Content-Type**: `application/json`

## 1. 헬스체크 (가장 먼저 테스트)

### GET /health
```
Method: GET
URL: https://b801-be.azurewebsites.net/health
```

**예상 응답:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-06T10:45:00.000Z",
  "environment": "production",
  "port": 8080,
  "database": "configured"
}
```

## 2. 사용자 관련 API

### POST /api/auth/register (회원가입)
```
Method: POST
URL: https://b801-be.azurewebsites.net/api/auth/register
Body (JSON):
{
  "username": "testuser",
  "password": "password123"
}
```

### POST /api/auth/login (로그인)
```
Method: POST
URL: https://b801-be.azurewebsites.net/api/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin"
}
```

**예상 응답:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "hp": 100,
    "energy": 100,
    "gold": 0,
    "current_day": 1
  }
}
```

## 3. 스토리 관련 API

### GET /api/story/current (현재 스토리 노드)
```
Method: GET
URL: https://b801-be.azurewebsites.net/api/story/current
Headers:
  Authorization: Bearer {accessToken}
```

### POST /api/story/choose (선택지 선택)
```
Method: POST
URL: https://b801-be.azurewebsites.net/api/story/choose
Headers:
  Authorization: Bearer {accessToken}
Body (JSON):
{
  "choiceId": 1
}
```

## 4. 조사 관련 API

### GET /api/investigation/start (조사 시작)
```
Method: GET
URL: https://b801-be.azurewebsites.net/api/investigation/start
Headers:
  Authorization: Bearer {accessToken}
```

### GET /api/investigation/current (현재 조사 상태)
```
Method: GET
URL: https://b801-be.azurewebsites.net/api/investigation/current
Headers:
  Authorization: Bearer {accessToken}
```

## 5. 관리자 API

### GET /api/admin/users (사용자 목록)
```
Method: GET
URL: https://b801-be.azurewebsites.net/api/admin/users
Headers:
  Authorization: Bearer {adminAccessToken}
```

## 테스트 순서:
1. **헬스체크** → 서버 상태 확인
2. **로그인** → 토큰 획득
3. **현재 스토리** → 데이터베이스 연결 확인
4. **조사 시작** → 게임 기능 테스트
5. **관리자 기능** → 권한 테스트

## 예상 문제들:
- **401 Unauthorized**: JWT 토큰 문제
- **500 Internal Server Error**: 데이터베이스 연결 문제
- **404 Not Found**: 엔드포인트 경로 문제
