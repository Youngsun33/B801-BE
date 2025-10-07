"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const client = new pg_1.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@b801-postgres-server.postgres.database.azure.com:5432/postgres?sslmode=require'
});
router.get('/areas', async (req, res) => {
    try {
        const result = await client.query(`
      SELECT id, name, description 
      FROM raid_search_areas 
      ORDER BY id
    `);
        res.json(result.rows);
    }
    catch (error) {
        console.error('지역 목록 조회 오류:', error);
        res.status(500).json({ message: '지역 목록 조회 실패' });
    }
});
router.get('/user-items', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }
        const result = await client.query(`
      SELECT item_name, quantity 
      FROM user_raid_items 
      WHERE user_id = $1 AND quantity > 0
      ORDER BY item_name
    `, [userId]);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('유저 아이템 조회 오류:', error);
        return res.status(500).json({ message: '아이템 목록 조회 실패' });
    }
});
router.get('/remaining', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }
        const today = new Date().toISOString().split('T')[0];
        const dayNumber = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));
        const countResult = await client.query(`
      SELECT count FROM daily_raid_search_count 
      WHERE user_id = $1 AND day = $2
    `, [userId, dayNumber]);
        const currentCount = countResult.rows[0]?.count || 0;
        const remainingSearches = Math.max(0, 25 - currentCount);
        return res.json({ remainingSearches });
    }
    catch (error) {
        console.error('검색 횟수 조회 오류:', error);
        return res.status(500).json({ message: '검색 횟수 조회 실패' });
    }
});
router.post('/search', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }
        const { areaId } = req.body;
        if (!areaId) {
            return res.status(400).json({ message: '지역 ID가 필요합니다' });
        }
        const today = new Date().toISOString().split('T')[0];
        const dayNumber = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));
        const countResult = await client.query(`
      SELECT count FROM daily_raid_search_count 
      WHERE user_id = $1 AND day = $2
    `, [userId, dayNumber]);
        const currentCount = countResult.rows[0]?.count || 0;
        if (currentCount >= 25) {
            return res.status(400).json({ message: '하루 최대 검색 횟수를 초과했습니다' });
        }
        const areaItemsResult = await client.query(`
      SELECT item_name, drop_rate 
      FROM raid_search_area_items 
      WHERE area_id = $1
    `, [areaId]);
        if (areaItemsResult.rows.length === 0) {
            return res.status(400).json({ message: '해당 지역의 아이템 정보를 찾을 수 없습니다' });
        }
        const foundItems = [];
        areaItemsResult.rows.forEach((item) => {
            const dropChance = Math.random() * 100;
            if (dropChance <= item.drop_rate) {
                const quantity = Math.floor(Math.random() * 3) + 1;
                const existingItem = foundItems.find(found => found.name === item.item_name);
                if (existingItem) {
                    existingItem.quantity += quantity;
                }
                else {
                    foundItems.push({ name: item.item_name, quantity });
                }
            }
        });
        for (const item of foundItems) {
            await client.query(`
        INSERT INTO user_raid_items (user_id, item_name, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_name)
        DO UPDATE SET 
          quantity = user_raid_items.quantity + $3,
          obtained_at = CURRENT_TIMESTAMP
      `, [userId, item.name, item.quantity]);
        }
        await client.query(`
      INSERT INTO daily_raid_search_count (user_id, day, count)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, day)
      DO UPDATE SET count = daily_raid_search_count.count + 1
    `, [userId, dayNumber]);
        const newCount = currentCount + 1;
        const remainingSearches = Math.max(0, 25 - newCount);
        return res.json({
            success: true,
            items: foundItems,
            remainingSearches
        });
    }
    catch (error) {
        console.error('레이드서치 실행 오류:', error);
        return res.status(500).json({ message: '레이드서치 실행 실패' });
    }
});
exports.default = router;
//# sourceMappingURL=raidSearch.js.map