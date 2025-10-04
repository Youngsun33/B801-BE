# 사용자 계정 생성 가이드

## 새 사용자 계정 생성

### 명령어
```bash
npm run create-user <username> <password>
```

### 예시
```bash
# 예시 1: 기본 계정 생성
npm run create-user player1 mypassword123

# 예시 2: 여러 계정 생성
npm run create-user player2 secure_pass456
npm run create-user player3 another_pass789
```

### 기본 스탯
새로 생성된 계정은 다음 기본 스탯을 가집니다:
- HP: 100
- 에너지: 100
- 골드: 1000
- 공격력: 10
- 현재 일차: 1
- 생존 여부: true

## 시드 데이터의 테스트 계정

현재 시드 데이터에 포함된 테스트 계정:
- **일반 유저**: `testuser` / `password123`
- **관리자**: `admin` / `password123`

## 주의사항
- 사용자명은 중복될 수 없습니다.
- 비밀번호는 최소 8자 이상이어야 합니다.
- 모든 계정 정보는 데이터베이스에 안전하게 암호화되어 저장됩니다.

## 계정 목록 확인
Prisma Studio를 사용하여 생성된 계정을 확인할 수 있습니다:
```bash
npx prisma studio
```

