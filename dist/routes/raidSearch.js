"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
const router = express_1.default.Router();
async function getDbConnection() {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
    });
    await client.connect();
    return client;
}
router.get('/areas', async (req, res) => {
    const client = await getDbConnection();
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
    finally {
        await client.end();
    }
});
router.get('/user-items', auth_1.authenticateAccessToken, async (req, res) => {
    const client = await getDbConnection();
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
    finally {
        await client.end();
    }
});
router.get('/remaining', auth_1.authenticateAccessToken, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const today = koreaTime.toISOString().split('T')[0];
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
    finally {
        await client.end();
    }
});
router.post('/search', auth_1.authenticateAccessToken, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: '인증이 필요합니다' });
        }
        const { areaId } = req.body;
        if (!areaId) {
            return res.status(400).json({ message: '지역 ID가 필요합니다' });
        }
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const today = koreaTime.toISOString().split('T')[0];
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
        const randomIndex = Math.floor(Math.random() * areaItemsResult.rows.length);
        const selectedItem = areaItemsResult.rows[randomIndex];
        const foundItem = { name: selectedItem.item_name, quantity: 1 };
        await client.query(`
      INSERT INTO user_raid_items (user_id, item_name, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_name)
      DO UPDATE SET 
        quantity = user_raid_items.quantity + $3,
        obtained_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul'
    `, [userId, foundItem.name, foundItem.quantity]);
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
            found: true,
            item: foundItem,
            remainingSearches
        });
    }
    catch (error) {
        console.error('레이드서치 실행 오류:', error);
        return res.status(500).json({ message: '레이드서치 실행 실패' });
    }
    finally {
        await client.end();
    }
});
router.get('/admin/all-users-items', auth_1.authenticateAccessToken, admin_1.requireAdmin, async (req, res) => {
    const client = await getDbConnection();
    try {
        const result = await client.query(`
      SELECT 
        u.username,
        uri.item_name,
        uri.quantity,
        uri.obtained_at
      FROM user_raid_items uri
      JOIN users u ON uri.user_id = u.id
      WHERE uri.quantity > 0
      ORDER BY u.username, uri.item_name
    `);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('전체 유저 레이드 아이템 조회 오류:', error);
        return res.status(500).json([]);
    }
    finally {
        await client.end();
    }
});
router.get('/admin/user-items/:userId', auth_1.authenticateAccessToken, admin_1.requireAdmin, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = parseInt(req.params.userId);
        const result = await client.query(`
      SELECT item_name, quantity, obtained_at
      FROM user_raid_items
      WHERE user_id = $1 AND quantity > 0
      ORDER BY item_name
    `, [userId]);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('유저 레이드 아이템 조회 오류:', error);
        return res.status(500).json([]);
    }
    finally {
        await client.end();
    }
});
router.put('/admin/user-items/:userId/:itemName', auth_1.authenticateAccessToken, admin_1.requireAdmin, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = parseInt(req.params.userId);
        const itemName = req.params.itemName;
        const { quantity } = req.body;
        if (!itemName || quantity === undefined) {
            return res.status(400).json({ message: '아이템명과 수량이 필요합니다' });
        }
        if (quantity < 0) {
            return res.status(400).json({ message: '수량은 0 이상이어야 합니다' });
        }
        if (quantity === 0) {
            await client.query(`
        DELETE FROM user_raid_items 
        WHERE user_id = $1 AND item_name = $2
      `, [userId, itemName]);
        }
        else {
            await client.query(`
        INSERT INTO user_raid_items (user_id, item_name, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_name)
        DO UPDATE SET quantity = $3
      `, [userId, itemName, quantity]);
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 수량 수정 오류:', error);
        return res.status(500).json({ message: '아이템 수량 수정 실패' });
    }
    finally {
        await client.end();
    }
});
router.delete('/admin/user-items/:userId/:itemName', auth_1.authenticateAccessToken, admin_1.requireAdmin, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = parseInt(req.params.userId);
        const itemName = req.params.itemName;
        await client.query(`
      DELETE FROM user_raid_items 
      WHERE user_id = $1 AND item_name = $2
    `, [userId, itemName]);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 삭제 오류:', error);
        return res.status(500).json({ message: '아이템 삭제 실패' });
    }
    finally {
        await client.end();
    }
});
router.post('/admin/user-items/:userId', auth_1.authenticateAccessToken, admin_1.requireAdmin, async (req, res) => {
    const client = await getDbConnection();
    try {
        const userId = parseInt(req.params.userId);
        const { itemName, item_name, quantity } = req.body;
        const itemName_final = itemName || item_name;
        if (!itemName_final || !quantity || quantity <= 0) {
            return res.status(400).json({ message: '아이템명과 양수인 수량이 필요합니다' });
        }
        await client.query(`
      INSERT INTO user_raid_items (user_id, item_name, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_name)
      DO UPDATE SET quantity = user_raid_items.quantity + $3
    `, [userId, itemName_final, quantity]);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 추가 오류:', error);
        return res.status(500).json({ message: '아이템 추가 실패' });
    }
    finally {
        await client.end();
    }
});
exports.default = router;
//# sourceMappingURL=raidSearch.js.map