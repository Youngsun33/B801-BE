"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/areas', async (req, res) => {
    try {
        const areas = await prisma_1.prisma.raidSearchArea.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(areas);
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
        const userItems = await prisma_1.prisma.userRaidItem.findMany({
            where: {
                user_id: userId,
                quantity: { gt: 0 }
            },
            orderBy: { item_name: 'asc' }
        });
        return res.json(userItems);
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
        const dailyCount = await prisma_1.prisma.dailyRaidSearchCount.findUnique({
            where: {
                user_id_day: {
                    user_id: userId,
                    day: dayNumber
                }
            }
        });
        const currentCount = dailyCount?.count || 0;
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
        const dailyCount = await prisma_1.prisma.dailyRaidSearchCount.findUnique({
            where: {
                user_id_day: {
                    user_id: userId,
                    day: dayNumber
                }
            }
        });
        const currentCount = dailyCount?.count || 0;
        if (currentCount >= 25) {
            return res.status(400).json({ message: '하루 최대 검색 횟수를 초과했습니다' });
        }
        const areaItems = await prisma_1.prisma.raidSearchAreaItem.findMany({
            where: { area_id: areaId }
        });
        if (areaItems.length === 0) {
            return res.status(400).json({ message: '해당 지역의 아이템 정보를 찾을 수 없습니다' });
        }
        const foundItems = [];
        areaItems.forEach((item) => {
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
            await prisma_1.prisma.userRaidItem.upsert({
                where: {
                    user_id_item_name: {
                        user_id: userId,
                        item_name: item.name
                    }
                },
                update: {
                    quantity: { increment: item.quantity }
                },
                create: {
                    user_id: userId,
                    item_name: item.name,
                    quantity: item.quantity
                }
            });
        }
        await prisma_1.prisma.dailyRaidSearchCount.upsert({
            where: {
                user_id_day: {
                    user_id: userId,
                    day: dayNumber
                }
            },
            update: {
                count: { increment: 1 }
            },
            create: {
                user_id: userId,
                day: dayNumber,
                count: 1
            }
        });
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
router.get('/admin/all-users-items', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const allUserItems = await prisma_1.prisma.userRaidItem.findMany({
            where: { quantity: { gt: 0 } },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: [
                { user: { username: 'asc' } },
                { item_name: 'asc' }
            ]
        });
        const formattedItems = allUserItems.map(item => ({
            username: item.user.username,
            item_name: item.item_name,
            quantity: item.quantity,
            obtained_at: item.obtained_at
        }));
        return res.json(formattedItems);
    }
    catch (error) {
        console.error('전체 유저 레이드 아이템 조회 오류:', error);
        return res.status(500).json({ message: '아이템 목록 조회 실패' });
    }
});
router.get('/admin/user-items/:userId', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const userItems = await prisma_1.prisma.userRaidItem.findMany({
            where: {
                user_id: userId,
                quantity: { gt: 0 }
            },
            orderBy: { item_name: 'asc' }
        });
        return res.json(userItems);
    }
    catch (error) {
        console.error('유저 레이드 아이템 조회 오류:', error);
        return res.status(500).json({ message: '아이템 목록 조회 실패' });
    }
});
router.put('/admin/user-items/:userId', auth_1.authenticateAccessToken, async (req, res) => {
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
            await prisma_1.prisma.userRaidItem.deleteMany({
                where: {
                    user_id: userId,
                    item_name: item_name
                }
            });
        }
        else {
            await prisma_1.prisma.userRaidItem.upsert({
                where: {
                    user_id_item_name: {
                        user_id: userId,
                        item_name: item_name
                    }
                },
                update: { quantity: quantity },
                create: {
                    user_id: userId,
                    item_name: item_name,
                    quantity: quantity
                }
            });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 수량 수정 오류:', error);
        return res.status(500).json({ message: '아이템 수량 수정 실패' });
    }
});
router.delete('/admin/user-items/:userId/:itemName', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const itemName = req.params.itemName;
        await prisma_1.prisma.userRaidItem.deleteMany({
            where: {
                user_id: userId,
                item_name: itemName
            }
        });
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 삭제 오류:', error);
        return res.status(500).json({ message: '아이템 삭제 실패' });
    }
});
router.post('/admin/user-items/:userId', auth_1.authenticateAccessToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { item_name, quantity } = req.body;
        if (!item_name || !quantity || quantity <= 0) {
            return res.status(400).json({ message: '아이템명과 양수인 수량이 필요합니다' });
        }
        await prisma_1.prisma.userRaidItem.upsert({
            where: {
                user_id_item_name: {
                    user_id: userId,
                    item_name: item_name
                }
            },
            update: {
                quantity: { increment: quantity }
            },
            create: {
                user_id: userId,
                item_name: item_name,
                quantity: quantity
            }
        });
        return res.json({ success: true });
    }
    catch (error) {
        console.error('아이템 추가 오류:', error);
        return res.status(500).json({ message: '아이템 추가 실패' });
    }
});
exports.default = router;
//# sourceMappingURL=raidSearch.js.map