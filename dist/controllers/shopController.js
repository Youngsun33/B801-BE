"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamRaidItems = exports.purchaseItem = exports.getShopItems = exports.getShopStatus = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const purchaseSchema = zod_1.z.object({
    itemId: zod_1.z.number().min(1),
    quantity: zod_1.z.number().min(1).max(10)
});
const teamItemsQuerySchema = zod_1.z.object({
    day: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined)
});
const isShopPhase = () => {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 12 && currentHour < 18;
};
const SHOP_ITEMS = {
    1: [
        {
            itemId: 5,
            name: '공격력 부스터',
            description: '공격력을 일시적으로 증가시킵니다.',
            type: 'raid',
            price: 100,
            limitPerTeam: 3
        },
        {
            itemId: 6,
            name: '방어막',
            description: '받는 피해를 줄여줍니다.',
            type: 'raid',
            price: 150,
            limitPerTeam: 2
        }
    ],
    2: [
        {
            itemId: 5,
            name: '공격력 부스터',
            description: '공격력을 일시적으로 증가시킵니다.',
            type: 'raid',
            price: 120,
            limitPerTeam: 4
        },
        {
            itemId: 6,
            name: '방어막',
            description: '받는 피해를 줄여줍니다.',
            type: 'raid',
            price: 180,
            limitPerTeam: 3
        }
    ],
    3: [
        {
            itemId: 5,
            name: '공격력 부스터',
            description: '공격력을 일시적으로 증가시킵니다.',
            type: 'raid',
            price: 150,
            limitPerTeam: 5
        },
        {
            itemId: 6,
            name: '방어막',
            description: '받는 피해를 줄여줍니다.',
            type: 'raid',
            price: 200,
            limitPerTeam: 4
        }
    ]
};
const getShopStatus = async (req, res) => {
    try {
        const isOpen = isShopPhase();
        const now = new Date();
        let closesAt;
        if (isOpen) {
            closesAt = new Date(now);
            closesAt.setHours(18, 0, 0, 0);
        }
        else {
            closesAt = new Date(now);
            if (now.getHours() >= 18) {
                closesAt.setDate(closesAt.getDate() + 1);
            }
            closesAt.setHours(12, 0, 0, 0);
        }
        return res.status(200).json({
            open: isOpen,
            closesAtIso: closesAt.toISOString()
        });
    }
    catch (error) {
        console.error('Get shop status error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getShopStatus = getShopStatus;
const getShopItems = async (req, res) => {
    try {
        if (!isShopPhase()) {
            return res.status(409).json({ error: '상점 페이즈가 아닙니다.' });
        }
        const { day } = req.query;
        const dayNum = day ? parseInt(day) : 1;
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
            return res.status(400).json({ error: '유효하지 않은 일차입니다. (1-3)' });
        }
        const items = SHOP_ITEMS[dayNum] || [];
        return res.status(200).json(items);
    }
    catch (error) {
        console.error('Get shop items error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getShopItems = getShopItems;
const purchaseItem = async (req, res) => {
    try {
        if (!isShopPhase()) {
            return res.status(409).json({ error: '상점 페이즈가 아닙니다.' });
        }
        const userId = req.user.userId;
        const { itemId, quantity } = purchaseSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        const currentDay = user.current_day;
        const shopItems = SHOP_ITEMS[currentDay] || [];
        const shopItem = shopItems.find(item => item.itemId === itemId);
        if (!shopItem) {
            return res.status(404).json({ error: '해당 아이템을 상점에서 찾을 수 없습니다.' });
        }
        const totalPrice = shopItem.price * quantity;
        if (user.gold < totalPrice) {
            return res.status(402).json({
                error: 'INSUFFICIENT_GOLD',
                message: '골드가 부족합니다.',
                required: totalPrice,
                current: user.gold
            });
        }
        let raidTeam = await prisma_1.prisma.raidTeam.findFirst({
            where: {
                day: currentDay,
                team_members: {
                    some: { user_id: userId }
                }
            },
            include: {
                raid_items: {
                    where: { item_id: itemId }
                }
            }
        });
        if (!raidTeam) {
            raidTeam = await prisma_1.prisma.raidTeam.create({
                data: {
                    day: currentDay,
                    status: 'ongoing',
                    boss_id: 1
                },
                include: {
                    raid_items: {
                        where: { item_id: itemId }
                    }
                }
            });
            await prisma_1.prisma.teamMember.create({
                data: {
                    team_id: raidTeam.id,
                    user_id: userId
                }
            });
        }
        const currentTeamItem = raidTeam.raid_items[0];
        const currentQuantity = currentTeamItem?.quantity || 0;
        if (currentQuantity + quantity > shopItem.limitPerTeam) {
            return res.status(409).json({
                error: '팀 구매 한도를 초과했습니다.',
                limit: shopItem.limitPerTeam,
                current: currentQuantity,
                requested: quantity
            });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { gold: user.gold - totalPrice }
            });
            if (currentTeamItem) {
                await tx.raidItem.update({
                    where: { id: currentTeamItem.id },
                    data: { quantity: currentTeamItem.quantity + quantity }
                });
            }
            else {
                await tx.raidItem.create({
                    data: {
                        team_id: raidTeam.id,
                        item_id: itemId,
                        quantity: quantity
                    }
                });
            }
        });
        return res.status(201).json({
            message: `${shopItem.name} ${quantity}개를 구매했습니다.`,
            item: {
                itemId: shopItem.itemId,
                name: shopItem.name,
                quantity: quantity,
                totalPrice: totalPrice
            },
            remainingGold: user.gold - totalPrice
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Purchase item error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.purchaseItem = purchaseItem;
const getTeamRaidItems = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { day } = teamItemsQuerySchema.parse(req.query);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        const targetDay = day || user.current_day;
        const raidTeam = await prisma_1.prisma.raidTeam.findFirst({
            where: {
                day: targetDay,
                team_members: {
                    some: { user_id: userId }
                }
            },
            include: {
                raid_items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                type: true
                            }
                        }
                    }
                }
            }
        });
        if (!raidTeam) {
            return res.status(404).json({ error: '해당 일차의 레이드 팀을 찾을 수 없습니다.' });
        }
        const formattedItems = raidTeam.raid_items.map((raidItem) => ({
            raidItemId: raidItem.id,
            quantity: raidItem.quantity,
            item: raidItem.item
        }));
        return res.status(200).json({
            teamId: raidTeam.id,
            day: raidTeam.day,
            raid_items: formattedItems
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '쿼리 파라미터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Get team raid items error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getTeamRaidItems = getTeamRaidItems;
//# sourceMappingURL=shopController.js.map