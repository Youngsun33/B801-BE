# Azure PostgreSQL 데이터베이스 확인 방법

## 1. Azure Portal에서 직접 확인 (가장 간단)

### 단계:
1. **Azure Portal** → **PostgreSQL 서버** → `b801-postgres-server`
2. 왼쪽 메뉴에서 **"Query editor (preview)"** 클릭
3. **"Connect with Azure AD"** 또는 **"Connect with PostgreSQL admin"** 선택
4. 로그인 정보 입력:
   - **Server**: b801-postgres-server.postgres.database.azure.com
   - **Username**: b801admin@b801-postgres-server
   - **Password**: admin123!
5. **"OK"** 클릭하여 연결

### 데이터 확인 쿼리:
```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 사용자 데이터 확인
SELECT id, username, hp, gold, current_day FROM users LIMIT 10;

-- 스토리 노드 확인
SELECT id, node_id, title FROM nodes LIMIT 10;

-- 조사 세션 확인
SELECT id, user_id, day, status FROM investigation_sessions LIMIT 10;

-- 총 레코드 수 확인
SELECT 
  'users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'nodes', count(*) FROM nodes
UNION ALL
SELECT 'choices', count(*) FROM choices
UNION ALL
SELECT 'investigation_sessions', count(*) FROM investigation_sessions;
```

## 2. Prisma Studio (로컬에서 Azure DB 연결)

### 실행 방법:
```bash
cd B801-BE
npx prisma studio --port 5556
```

### 브라우저에서 접속:
- URL: `http://localhost:5556`
- 모든 테이블과 데이터를 GUI로 확인 가능

## 3. pgAdmin (PostgreSQL 전용 GUI 도구)

### 설치:
1. **pgAdmin 4** 다운로드: https://www.pgadmin.org/download/
2. 설치 후 실행

### 연결 설정:
- **Host**: b801-postgres-server.postgres.database.azure.com
- **Port**: 5432
- **Database**: postgres
- **Username**: b801admin@b801-postgres-server
- **Password**: admin123!
- **SSL Mode**: Require

## 4. DBeaver (무료 데이터베이스 도구)

### 설치:
1. **DBeaver Community** 다운로드: https://dbeaver.io/download/
2. 설치 후 실행

### 연결 설정:
- **Database**: PostgreSQL
- **Server Host**: b801-postgres-server.postgres.database.azure.com
- **Port**: 5432
- **Database**: postgres
- **Username**: b801admin@b801-postgres-server
- **Password**: admin123!

## 5. VS Code PostgreSQL 확장

### 확장 설치:
1. VS Code에서 **"PostgreSQL"** 확장 설치
2. **Ctrl+Shift+P** → **"PostgreSQL: New Query"**

### 연결 설정:
- **Host**: b801-postgres-server.postgres.database.azure.com
- **Port**: 5432
- **Database**: postgres
- **Username**: b801admin@b801-postgres-server
- **Password**: admin123!

## 추천 순서:
1. **Azure Portal Query Editor** (가장 빠름)
2. **Prisma Studio** (개발용으로 편리)
3. **pgAdmin** (PostgreSQL 전문 도구)
