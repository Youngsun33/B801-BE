import express from 'express';
import { Request, Response } from 'express';
import { Client } from 'pg';
import { authenticateAccessToken } from '../middleware/auth';

const router = express.Router();

// 데이터베이스 연결 함수
async function getDbConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://b801admin:admin123!@uct-b801.postgres.database.azure.com:5432/postgres?sslmode=require'
  });
  await client.connect();
  return client;
}

// 레이드서치 지역 목록 조회
router.get('/areas', async (req: Request, res: Response) => {
  const client = await getDbConnection();
  try {
    const result = await client.query(`
      SELECT id, name, description 
      FROM raid_search_areas 
      ORDER BY id
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('지역 목록 조회 오류:', error);
    res.status(500).json({ message: '지역 목록 조회 실패' });
  } finally {
    await client.end();
  }
});

// 유저의 레이드 아이템 목록 조회
router.get('/user-items', authenticateAccessToken, async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('유저 아이템 조회 오류:', error);
    return res.status(500).json({ message: '아이템 목록 조회 실패' });
  } finally {
    await client.end();
  }
});

// 남은 검색 횟수 조회
router.get('/remaining', authenticateAccessToken, async (req: Request, res: Response) => {
  const client = await getDbConnection();
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: '인증이 필요합니다' });
    }

    const today = new Date().toISOString().split('T')[0];
    const dayNumber = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));

    // 오늘의 검색 카운트 조회
    const countResult = await client.query(`
      SELECT count FROM daily_raid_search_count 
      WHERE user_id = $1 AND day = $2
    `, [userId, dayNumber]);

    const currentCount = countResult.rows[0]?.count || 0;
    const remainingSearches = Math.max(0, 25 - currentCount);

    return res.json({ remainingSearches });
  } catch (error) {
    console.error('검색 횟수 조회 오류:', error);
    return res.status(500).json({ message: '검색 횟수 조회 실패' });
  } finally {
    await client.end();
  }
});

// 레이드서치 실행 - 수정된 로직
router.post('/search', authenticateAccessToken, async (req: Request, res: Response) => {
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

    const today = new Date().toISOString().split('T')[0];
    const dayNumber = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));

    // 오늘의 검색 횟수 확인
    const countResult = await client.query(`
      SELECT count FROM daily_raid_search_count 
      WHERE user_id = $1 AND day = $2
    `, [userId, dayNumber]);

    const currentCount = countResult.rows[0]?.count || 0;
    if (currentCount >= 25) {
      return res.status(400).json({ message: '하루 최대 검색 횟수를 초과했습니다' });
    }

    // 지역 아이템 목록 조회
    const areaItemsResult = await client.query(`
      SELECT item_name, drop_rate 
      FROM raid_search_area_items 
      WHERE area_id = $1
    `, [areaId]);

    if (areaItemsResult.rows.length === 0) {
      return res.status(400).json({ message: '해당 지역의 아이템 정보를 찾을 수 없습니다' });
    }

    // 랜덤으로 하나의 아이템만 선택
    const randomIndex = Math.floor(Math.random() * areaItemsResult.rows.length);
    const selectedItem = areaItemsResult.rows[randomIndex];
    
    // 드롭 확률 확인
    const dropChance = Math.random() * 100;
    let foundItem = null;
    
    if (dropChance <= selectedItem.drop_rate) {
      // 드롭된 경우, 무조건 1개 획득
      foundItem = { name: selectedItem.item_name, quantity: 1 };
      
      // 아이템을 유저 인벤토리에 추가
      await client.query(`
        INSERT INTO user_raid_items (user_id, item_name, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_name)
        DO UPDATE SET 
          quantity = user_raid_items.quantity + $3,
          obtained_at = CURRENT_TIMESTAMP
      `, [userId, foundItem.name, foundItem.quantity]);
    }

    // 검색 횟수 증가
    await client.query(`
      INSERT INTO daily_raid_search_count (user_id, day, count)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, day)
      DO UPDATE SET count = daily_raid_search_count.count + 1
    `, [userId, dayNumber]);

    // 업데이트된 남은 검색 횟수 계산
    const newCount = currentCount + 1;
    const remainingSearches = Math.max(0, 25 - newCount);

    return res.json({
      success: true,
      found: foundItem ? true : false,
      item: foundItem,
      remainingSearches
    });

  } catch (error) {
    console.error('레이드서치 실행 오류:', error);
    return res.status(500).json({ message: '레이드서치 실행 실패' });
  } finally {
    await client.end();
  }
});

// 관리자용 레이드 아이템 관리 API
// 모든 유저의 레이드 아이템 조회
router.get('/admin/all-users-items', authenticateAccessToken, async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('전체 유저 레이드 아이템 조회 오류:', error);
    return res.status(500).json([]); // 에러 시에도 빈 배열 반환
  } finally {
    await client.end();
  }
});

// 특정 유저의 레이드 아이템 조회
router.get('/admin/user-items/:userId', authenticateAccessToken, async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('유저 레이드 아이템 조회 오류:', error);
    return res.status(500).json([]); // 에러 시에도 빈 배열 반환
  } finally {
    await client.end();
  }
});

// 유저 레이드 아이템 수량 수정
router.put('/admin/user-items/:userId', authenticateAccessToken, async (req: Request, res: Response) => {
  const client = await getDbConnection();
  try {
    const userId = parseInt(req.params.userId);
    const { item_name, quantity } = req.body;
    
    if (!item_name || quantity === undefined) {
      return res.status(400).json({ message: '아이템명과 수량이 필요합니다' });
    }
    
    if (quantity < 0) {
      return res.status(400).json({ message: '수량은 0 이상이어야 합니다' });
    }
    
    if (quantity === 0) {
      // 수량이 0이면 삭제
      await client.query(`
        DELETE FROM user_raid_items 
        WHERE user_id = $1 AND item_name = $2
      `, [userId, item_name]);
    } else {
      // 수량 업데이트 또는 새로 추가
      await client.query(`
        INSERT INTO user_raid_items (user_id, item_name, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, item_name)
        DO UPDATE SET quantity = $3
      `, [userId, item_name, quantity]);
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('아이템 수량 수정 오류:', error);
    return res.status(500).json({ message: '아이템 수량 수정 실패' });
  } finally {
    await client.end();
  }
});

// 유저 레이드 아이템 삭제
router.delete('/admin/user-items/:userId/:itemName', authenticateAccessToken, async (req: Request, res: Response) => {
  const client = await getDbConnection();
  try {
    const userId = parseInt(req.params.userId);
    const itemName = req.params.itemName;
    
    await client.query(`
      DELETE FROM user_raid_items 
      WHERE user_id = $1 AND item_name = $2
    `, [userId, itemName]);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('아이템 삭제 오류:', error);
    return res.status(500).json({ message: '아이템 삭제 실패' });
  } finally {
    await client.end();
  }
});

// 유저 레이드 아이템 추가
router.post('/admin/user-items/:userId', authenticateAccessToken, async (req: Request, res: Response) => {
  const client = await getDbConnection();
  try {
    const userId = parseInt(req.params.userId);
    const { item_name, quantity } = req.body;
    
    if (!item_name || !quantity || quantity <= 0) {
      return res.status(400).json({ message: '아이템명과 양수인 수량이 필요합니다' });
    }
    
    await client.query(`
      INSERT INTO user_raid_items (user_id, item_name, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_name)
      DO UPDATE SET quantity = user_raid_items.quantity + $3
    `, [userId, item_name, quantity]);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('아이템 추가 오류:', error);
    return res.status(500).json({ message: '아이템 추가 실패' });
  } finally {
    await client.end();
  }
});

export default router;