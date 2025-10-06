# PostgreSQL 연결 정보

## Azure PostgreSQL 서버 정보
- **서버명**: b801-postgres-server
- **관리자**: b801admin
- **위치**: Korea Central
- **PostgreSQL 버전**: 17

## 연결 문자열
```
DATABASE_URL="postgresql://b801admin@b801-postgres-server:YOUR_PASSWORD_HERE@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require"
```

## 다음 단계
1. Azure Portal에서 비밀번호 확인
2. YOUR_PASSWORD_HERE를 실제 비밀번호로 교체
3. 환경변수 설정
4. PostgreSQL 스키마 생성
5. 데이터 가져오기
