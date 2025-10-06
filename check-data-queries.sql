-- Azure PostgreSQL 데이터 확인 쿼리들

-- 1. 테이블 목록 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. 사용자 데이터 확인
SELECT id, username, hp, gold, current_day FROM users LIMIT 10;

-- 3. 스토리 노드 확인  
SELECT id, node_id, title FROM nodes LIMIT 10;

-- 4. 조사 세션 확인
SELECT id, user_id, day, status FROM investigation_sessions LIMIT 10;

-- 5. 총 레코드 수 확인
SELECT 
  'users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'nodes', count(*) FROM nodes  
UNION ALL
SELECT 'choices', count(*) FROM choices
UNION ALL
SELECT 'resources', count(*) FROM resources
UNION ALL
SELECT 'investigation_sessions', count(*) FROM investigation_sessions
UNION ALL
SELECT 'abilities', count(*) FROM abilities
UNION ALL
SELECT 'bosses', count(*) FROM bosses
ORDER BY count DESC;

-- 6. 특정 사용자의 조사 세션 확인
SELECT 
  u.username,
  i.day,
  i.status,
  i.hp,
  i.energy,
  i.gold_start,
  i.gold_end
FROM investigation_sessions i
JOIN users u ON i.user_id = u.id
ORDER BY i.created_at DESC
LIMIT 20;
