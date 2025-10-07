-- 레이드서치 지역 데이터 입력
INSERT INTO raid_search_areas (name, description) VALUES
('등산로', '산악 지역의 등산로'),
('청계천', '도심의 하천 지역'),
('번화가', '상업 지구의 번화한 거리'),
('터널', '지하 통로와 터널'),
('슬럼가', '빈민가와 슬럼가 지역'),
('골목길', '좁은 골목길'),
('학교', '교육 시설'),
('소방서', '소방 시설'),
('고급주택가', '고급 주거 지역'),
('물류창고', '물류 창고 지역');

-- 등산로 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(1, '감시카메라', 8),
(1, '마패', 8),
(1, '가위', 25),
(1, '망치', 33),
(1, '가죽', 25);

-- 청계천 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(2, '못', 8),
(2, '곡괭이', 17),
(2, '나뭇가지', 25),
(2, '오일', 33),
(2, '가죽', 17);

-- 번화가 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(3, '부채', 8),
(3, '깃털', 17),
(3, '돌멩이', 25),
(3, '종이', 33),
(3, '가죽', 17);

-- 터널 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(4, '대나무', 17),
(4, '리본', 17),
(4, '라이터', 25),
(4, '레이저 포인터', 25),
(4, '가죽', 17);

-- 슬럼가 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(5, '분필', 8),
(5, '만년필', 17),
(5, '머리띠', 17),
(5, '배터리', 42),
(5, '고철', 17);

-- 골목길 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(6, '붕대', 17),
(6, '쇠구슬', 17),
(6, '모자', 25),
(6, '물', 25),
(6, '고철', 17);

-- 학교 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(7, '쌍안경', 17),
(7, '운동화', 17),
(7, '바람막이', 25),
(7, '쇠사슬', 25),
(7, '고철', 17);

-- 소방서 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(8, '슬리퍼', 8),
(8, '유리병', 17),
(8, '원석', 25),
(8, '철광석', 33),
(8, '고철', 17);

-- 고급주택가 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(9, '옷감', 8),
(9, '접착제', 17),
(9, '자전거 헬멧', 25),
(9, '화약', 33),
(9, '고철', 17);

-- 물류창고 아이템 데이터 (12개)
INSERT INTO raid_search_area_items (area_id, item_name, drop_rate) VALUES
(10, '타이즈', 8),
(10, '탄산수', 8),
(10, '천갑옷', 25),
(10, '피아노선', 42),
(10, '고철', 17);
