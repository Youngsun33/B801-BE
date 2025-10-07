-- 레이드서치 관련 테이블 생성

-- 레이드서치 지역 테이블
CREATE TABLE IF NOT EXISTS raid_search_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 레이드서치 지역별 아이템 테이블
CREATE TABLE IF NOT EXISTS raid_search_area_items (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES raid_search_areas(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    drop_rate INTEGER NOT NULL -- 드롭 확률 (퍼센트)
);

-- 유저 레이드 아이템 테이블
CREATE TABLE IF NOT EXISTS user_raid_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 0,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_name)
);

-- 일일 레이드서치 카운트 테이블
CREATE TABLE IF NOT EXISTS daily_raid_search_count (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    count INTEGER DEFAULT 0,
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day)
);
