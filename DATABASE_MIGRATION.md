# 데이터베이스 마이그레이션 가이드 (SQLite → PostgreSQL)

## 1. Azure Database for PostgreSQL 설정

### Azure Portal에서 데이터베이스 생성
1. **Create a resource** → **Azure Database for PostgreSQL**
2. **Flexible Server** 선택
3. 설정:
   ```
   Server name: b801-postgres-server
   Admin username: b801admin
   Password: [강력한 비밀번호 생성]
   Region: 한국 중부
   PostgreSQL version: 15
   ```

### 연결 정보
- **호스트**: `b801-postgres-server.postgres.database.azure.com`
- **포트**: `5432`
- **데이터베이스**: `postgres` (기본)
- **사용자명**: `b801admin@b801-postgres-server`

## 2. 환경변수 설정

### 로컬 개발용 (.env 파일)
```env
DATABASE_URL="postgresql://b801admin@b801-postgres-server:YOUR_PASSWORD@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require"
```

### Azure App Service 환경변수
```
DATABASE_URL=postgresql://b801admin@b801-postgres-server:YOUR_PASSWORD@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require
```

## 3. 데이터 마이그레이션 단계

### 3-1. SQLite 데이터 내보내기
```bash
# SQLite로 데이터 내보내기
DATABASE_URL="file:./dev.db" node export-sqlite-data.js
```

### 3-2. PostgreSQL 스키마 생성
```bash
# PostgreSQL 연결로 변경 후
DATABASE_URL="postgresql://..." npx prisma db push
```

### 3-3. 데이터 가져오기
```bash
# PostgreSQL로 데이터 가져오기
DATABASE_URL="postgresql://..." node import-to-postgres.js
```

## 4. GitHub Actions 업데이트

### 환경변수 추가
GitHub Repository → Settings → Secrets and variables → Actions:
```
DATABASE_URL=postgresql://b801admin@b801-postgres-server:YOUR_PASSWORD@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require
```

### workflow 파일 업데이트
```yaml
app-settings: |
  NODE_ENV=production
  PORT=8080
  JWT_ACCESS_SECRET=${{ secrets.JWT_ACCESS_SECRET }}
  JWT_REFRESH_SECRET=${{ secrets.JWT_REFRESH_SECRET }}
  DATABASE_URL=${{ secrets.DATABASE_URL }}
```

## 5. 장점

### SQLite vs PostgreSQL
- ✅ **확장성**: 여러 인스턴스에서 동시 접근 가능
- ✅ **안정성**: 트랜잭션 및 데이터 무결성 보장
- ✅ **성능**: 대용량 데이터 처리 최적화
- ✅ **백업**: 자동 백업 및 복구 기능
- ✅ **모니터링**: Azure Portal에서 성능 모니터링

## 6. 비용

### Azure Database for PostgreSQL Flexible Server
- **Basic**: 월 $5-10 (개발용)
- **General Purpose**: 월 $20-50 (프로덕션용)
- **Memory Optimized**: 월 $50-100 (고성능)

## 7. 보안

### 연결 보안
- SSL/TLS 암호화 연결 필수
- 방화벽 규칙으로 IP 제한
- Azure Active Directory 인증 지원

### 데이터 보안
- 자동 백업 (7-35일 보관)
- 지리적 복제 지원
- 투명한 데이터 암호화
