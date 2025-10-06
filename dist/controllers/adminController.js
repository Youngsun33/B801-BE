"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.getAdminStats = exports.updateInvestigationCount = exports.getAllResources = exports.deleteUserCheckpoint = exports.deleteUserAbility = exports.addUserAbility = exports.deleteUserItem = exports.addUserItem = exports.updateUser = exports.getUserDetail = exports.getAllUsers = exports.createStoryNode = exports.deleteStoryNode = exports.updateStoryNode = exports.getStoryNodes = exports.importTwineFile = void 0;
const prisma_1 = require("../lib/prisma");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const parseTwineToMainStory_1 = require("../lib/parseTwineToMainStory");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/octet-stream', 'text/plain', 'text/twee'];
        const allowedExtensions = ['.twine', '.twee', '.txt'];
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error('Twine 파일(.twine, .twee) 또는 텍스트 파일(.txt)만 업로드 가능합니다.'));
        }
    }
});
exports.upload = upload;
const importTwineFile = async (req, res) => {
    try {
        console.log('📁 Twine 파일 임포트 시작...');
        if (!req.file) {
            return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
        }
        const twineContent = req.file.buffer.toString('utf-8');
        console.log(`📖 파일 크기: ${twineContent.length} 문자`);
        const parsedStories = (0, parseTwineToMainStory_1.parseTwineDocument)(twineContent);
        console.log(`📊 ${parsedStories.length}개의 스토리 노드 파싱 완료`);
        console.log('\n📍 처음 3개 노드의 위치 정보:');
        parsedStories.slice(0, 3).forEach((story, idx) => {
            console.log(`  ${idx + 1}. "${story.title}": position_x=${story.position_x}, position_y=${story.position_y}`);
        });
        if (parsedStories.length === 0) {
            return res.status(400).json({ error: '유효한 스토리 노드를 찾을 수 없습니다.' });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            const deletedCount = await tx.mainStory.deleteMany({});
            console.log(`🗑️ 기존 메인 스토리 ${deletedCount.count}개 삭제 완료`);
            console.log(`📝 ${parsedStories.length}개 노드 삽입 시작...`);
            const batchSize = 100;
            for (let i = 0; i < parsedStories.length; i += batchSize) {
                const batch = parsedStories.slice(i, i + batchSize);
                await tx.mainStory.createMany({
                    data: batch
                });
                console.log(`✅ ${Math.min(i + batchSize, parsedStories.length)}/${parsedStories.length} 노드 삽입 완료`);
            }
        }, {
            maxWait: 30000,
            timeout: 30000,
        });
        console.log('✅ 메인 스토리 임포트 완료!');
        const stats = {
            totalNodes: parsedStories.length,
            checkpointNodes: parsedStories.filter(s => s.node_type === 'checkpoint').length,
            mainNodes: parsedStories.filter(s => s.node_type === 'main').length,
            routeNames: [...new Set(parsedStories.map(s => s.route_name).filter(Boolean))]
        };
        return res.status(200).json({
            message: 'Twine 파일이 성공적으로 임포트되었습니다!',
            stats: stats
        });
    }
    catch (error) {
        console.error('❌ Twine 파일 임포트 중 오류:', error);
        if (error instanceof Error) {
            if (error.message.includes('Twine 파일')) {
                return res.status(400).json({ error: error.message });
            }
        }
        return res.status(500).json({
            error: '파일 임포트 중 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.importTwineFile = importTwineFile;
const getStoryNodes = async (req, res) => {
    try {
        const nodes = await prisma_1.prisma.$queryRaw `
      SELECT * FROM nodes 
      ORDER BY story_id, node_id ASC
    `;
        return res.status(200).json({
            nodes: nodes,
            totalCount: nodes.length
        });
    }
    catch (error) {
        console.error('❌ 스토리 노드 조회 중 오류:', error);
        return res.status(500).json({ error: '스토리 노드를 불러오는 중 오류가 발생했습니다.' });
    }
};
exports.getStoryNodes = getStoryNodes;
const updateStoryNode = async (req, res) => {
    return res.status(501).json({
        error: '이 기능은 현재 재구현 중입니다.',
        message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
    });
};
exports.updateStoryNode = updateStoryNode;
const deleteStoryNode = async (req, res) => {
    return res.status(501).json({
        error: '이 기능은 현재 재구현 중입니다.',
        message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
    });
};
exports.deleteStoryNode = deleteStoryNode;
const createStoryNode = async (req, res) => {
    return res.status(501).json({
        error: '이 기능은 현재 재구현 중입니다.',
        message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
    });
};
exports.createStoryNode = createStoryNode;
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                hp: true,
                energy: true,
                gold: true,
                attack_power: true,
                current_day: true,
                is_alive: true,
                role: true,
                daily_investigation_count: {
                    select: {
                        day: true,
                        count: true,
                        last_reset: true
                    }
                },
                user_checkpoints: {
                    select: {
                        id: true,
                        node_id: true,
                        title: true,
                        description: true,
                        saved_at: true
                    },
                    orderBy: {
                        saved_at: 'desc'
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });
        const usersWithResources = await Promise.all(users.map(async (user) => {
            const items = await prisma_1.prisma.$queryRaw `
          SELECT ur.id, ur.quantity, r.id as resource_id, r.name, r.description
          FROM user_resources ur
          JOIN resources r ON ur.resource_id = r.id
          WHERE ur.user_id = ${user.id} AND r.type = 'ITEM'
        `;
            const abilities = await prisma_1.prisma.$queryRaw `
          SELECT ur.id, ur.quantity, r.id as resource_id, r.name, r.description
          FROM user_resources ur
          JOIN resources r ON ur.resource_id = r.id
          WHERE ur.user_id = ${user.id} AND r.type = 'SKILL'
        `;
            return {
                ...user,
                user_story_items: items.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    story_item: {
                        id: item.resource_id,
                        name: item.name,
                        description: item.description
                    }
                })),
                user_story_abilities: abilities.map((ability) => ({
                    id: ability.id,
                    quantity: ability.quantity,
                    story_ability: {
                        id: ability.resource_id,
                        name: ability.name,
                        description: ability.description
                    }
                }))
            };
        }));
        return res.status(200).json({ users: usersWithResources });
    }
    catch (error) {
        console.error('유저 목록 조회 오류:', error);
        return res.status(500).json({ error: '유저 목록을 불러오는 중 오류가 발생했습니다.' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserDetail = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                daily_investigation_count: true,
                user_checkpoints: {
                    orderBy: {
                        saved_at: 'desc'
                    }
                },
                story_progress: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
        }
        const items = await prisma_1.prisma.$queryRaw `
      SELECT ur.id, ur.quantity, ur.obtained_at, r.id as resource_id, r.name, r.description
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId} AND r.type = 'ITEM'
      ORDER BY r.name
    `;
        const abilities = await prisma_1.prisma.$queryRaw `
      SELECT ur.id, ur.quantity, ur.obtained_at, r.id as resource_id, r.name, r.description
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId} AND r.type = 'SKILL'
      ORDER BY r.name
    `;
        const inventory = await prisma_1.prisma.inventory.findMany({
            where: { user_id: userId },
            include: {
                item: true
            }
        });
        const userWithResources = {
            ...user,
            user_story_items: items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                obtained_at: item.obtained_at,
                story_item: {
                    id: item.resource_id,
                    name: item.name,
                    description: item.description
                }
            })),
            user_story_abilities: abilities.map((ability) => ({
                id: ability.id,
                quantity: ability.quantity,
                obtained_at: ability.obtained_at,
                story_ability: {
                    id: ability.resource_id,
                    name: ability.name,
                    description: ability.description
                }
            })),
            inventory: inventory
        };
        return res.status(200).json({ user: userWithResources });
    }
    catch (error) {
        console.error('유저 상세 조회 오류:', error);
        return res.status(500).json({ error: '유저 정보를 불러오는 중 오류가 발생했습니다.' });
    }
};
exports.getUserDetail = getUserDetail;
const updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { hp, energy, gold, attack_power, current_day, is_alive } = req.body;
        const updateData = {};
        if (hp !== undefined)
            updateData.hp = hp;
        if (energy !== undefined)
            updateData.energy = energy;
        if (gold !== undefined)
            updateData.gold = gold;
        if (attack_power !== undefined)
            updateData.attack_power = attack_power;
        if (current_day !== undefined)
            updateData.current_day = current_day;
        if (is_alive !== undefined)
            updateData.is_alive = is_alive;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        return res.status(200).json({
            message: '유저 정보가 수정되었습니다.',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('유저 정보 수정 오류:', error);
        return res.status(500).json({ error: '유저 정보를 수정하는 중 오류가 발생했습니다.' });
    }
};
exports.updateUser = updateUser;
const addUserItem = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { resource_id, quantity } = req.body;
        const existingResource = await prisma_1.prisma.userResource.findFirst({
            where: {
                user_id: userId,
                resource_id: resource_id
            }
        });
        if (existingResource) {
            const updated = await prisma_1.prisma.userResource.update({
                where: { id: existingResource.id },
                data: {
                    quantity: existingResource.quantity + quantity
                }
            });
            return res.status(200).json({ message: '아이템 수량이 증가되었습니다.', resource: updated });
        }
        else {
            const newResource = await prisma_1.prisma.userResource.create({
                data: {
                    user_id: userId,
                    resource_id: resource_id,
                    quantity: quantity
                }
            });
            return res.status(201).json({ message: '아이템이 추가되었습니다.', resource: newResource });
        }
    }
    catch (error) {
        console.error('아이템 추가 오류:', error);
        return res.status(500).json({ error: '아이템을 추가하는 중 오류가 발생했습니다.' });
    }
};
exports.addUserItem = addUserItem;
const deleteUserItem = async (req, res) => {
    try {
        const resourceId = parseInt(req.params.resourceId);
        await prisma_1.prisma.userResource.delete({
            where: { id: resourceId }
        });
        return res.status(200).json({ message: '아이템이 삭제되었습니다.' });
    }
    catch (error) {
        console.error('아이템 삭제 오류:', error);
        return res.status(500).json({ error: '아이템을 삭제하는 중 오류가 발생했습니다.' });
    }
};
exports.deleteUserItem = deleteUserItem;
const addUserAbility = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { resource_id, quantity } = req.body;
        const existingResource = await prisma_1.prisma.userResource.findFirst({
            where: {
                user_id: userId,
                resource_id: resource_id
            }
        });
        if (existingResource) {
            const updated = await prisma_1.prisma.userResource.update({
                where: { id: existingResource.id },
                data: {
                    quantity: existingResource.quantity + quantity
                }
            });
            return res.status(200).json({ message: '능력 레벨이 증가되었습니다.', resource: updated });
        }
        else {
            const newResource = await prisma_1.prisma.userResource.create({
                data: {
                    user_id: userId,
                    resource_id: resource_id,
                    quantity: quantity
                }
            });
            return res.status(201).json({ message: '능력이 추가되었습니다.', resource: newResource });
        }
    }
    catch (error) {
        console.error('능력 추가 오류:', error);
        return res.status(500).json({ error: '능력을 추가하는 중 오류가 발생했습니다.' });
    }
};
exports.addUserAbility = addUserAbility;
const deleteUserAbility = async (req, res) => {
    try {
        const resourceId = parseInt(req.params.resourceId);
        await prisma_1.prisma.userResource.delete({
            where: { id: resourceId }
        });
        return res.status(200).json({ message: '능력이 삭제되었습니다.' });
    }
    catch (error) {
        console.error('능력 삭제 오류:', error);
        return res.status(500).json({ error: '능력을 삭제하는 중 오류가 발생했습니다.' });
    }
};
exports.deleteUserAbility = deleteUserAbility;
const deleteUserCheckpoint = async (req, res) => {
    try {
        const checkpointId = parseInt(req.params.checkpointId);
        await prisma_1.prisma.userCheckpoint.delete({
            where: { id: checkpointId }
        });
        return res.status(200).json({ message: '체크포인트가 삭제되었습니다.' });
    }
    catch (error) {
        console.error('체크포인트 삭제 오류:', error);
        return res.status(500).json({ error: '체크포인트를 삭제하는 중 오류가 발생했습니다.' });
    }
};
exports.deleteUserCheckpoint = deleteUserCheckpoint;
const getAllResources = async (req, res) => {
    try {
        const { type } = req.query;
        let resources;
        if (type === 'ITEM') {
            resources = await prisma_1.prisma.$queryRaw `
        SELECT * FROM resources WHERE type = 'ITEM' ORDER BY name
      `;
        }
        else if (type === 'SKILL') {
            resources = await prisma_1.prisma.$queryRaw `
        SELECT * FROM resources WHERE type = 'SKILL' ORDER BY name
      `;
        }
        else {
            resources = await prisma_1.prisma.$queryRaw `
        SELECT * FROM resources ORDER BY type, name
      `;
        }
        return res.status(200).json({ resources });
    }
    catch (error) {
        console.error('리소스 목록 조회 오류:', error);
        return res.status(500).json({ error: '리소스 목록을 불러오는 중 오류가 발생했습니다.' });
    }
};
exports.getAllResources = getAllResources;
const updateInvestigationCount = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { day, count } = req.body;
        const existing = await prisma_1.prisma.dailyInvestigationCount.findFirst({
            where: {
                user_id: userId,
                day: day
            }
        });
        if (existing) {
            await prisma_1.prisma.dailyInvestigationCount.update({
                where: { id: existing.id },
                data: { count: count }
            });
        }
        else {
            await prisma_1.prisma.dailyInvestigationCount.create({
                data: {
                    user_id: userId,
                    day: day,
                    count: count
                }
            });
        }
        return res.status(200).json({
            message: '조사 기회가 수정되었습니다.',
            count: count
        });
    }
    catch (error) {
        console.error('조사 기회 수정 오류:', error);
        return res.status(500).json({ error: '조사 기회를 수정하는 중 오류가 발생했습니다.' });
    }
};
exports.updateInvestigationCount = updateInvestigationCount;
const getAdminStats = async (req, res) => {
    try {
        const userCount = await prisma_1.prisma.user.count();
        const mainStoryCount = await prisma_1.prisma.mainStory.count();
        const activeUsers = await prisma_1.prisma.user.count({
            where: { is_alive: true }
        });
        const completedSessions = await prisma_1.prisma.investigationSession.count({
            where: { status: 'completed' }
        });
        return res.status(200).json({
            stats: {
                totalUsers: userCount,
                activeUsers: activeUsers,
                storyNodes: mainStoryCount,
                completedPlays: completedSessions
            }
        });
    }
    catch (error) {
        console.error('❌ 관리자 통계 조회 중 오류:', error);
        return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
    }
};
exports.getAdminStats = getAdminStats;
//# sourceMappingURL=adminController.js.map