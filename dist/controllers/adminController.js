"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserCheckpoint = exports.deleteUserResource = exports.addUserAbility = exports.addUserItem = exports.updateUserInvestigationCount = exports.updateAdminUser = exports.getAdminUserDetail = exports.getAdminResources = exports.getAdminUsers = exports.upload = exports.getAdminStats = exports.createStoryNode = exports.deleteStoryNode = exports.updateStoryNode = exports.getStoryNodes = exports.importTwineFile = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
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
const getAdminStats = async (req, res) => {
    try {
        const userCount = await prisma_1.prisma.user.count();
        const storyNodeResult = await prisma_1.prisma.$queryRaw `
      SELECT COUNT(*) as count FROM nodes
    `;
        const rawCount = storyNodeResult[0]?.count;
        const storyNodeCount = typeof rawCount === 'bigint'
            ? Number(rawCount)
            : Number(rawCount || 0);
        const activeUsers = userCount;
        return res.status(200).json({
            stats: {
                totalUsers: Number(userCount),
                activeUsers: Number(activeUsers),
                storyNodes: Number(storyNodeCount),
                completedPlays: 0
            }
        });
    }
    catch (error) {
        console.error('❌ 관리자 통계 조회 중 오류:', error);
        return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
    }
};
exports.getAdminStats = getAdminStats;
const getAdminUsers = async (req, res) => {
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
                is_alive: true
            },
            orderBy: { id: 'asc' }
        });
        if (users.length === 0) {
            return res.status(200).json({ users: [], totalCount: 0 });
        }
        const userIds = users.map(u => u.id);
        const dailyCounts = await prisma_1.prisma.$queryRaw `
      SELECT user_id, day, count
      FROM daily_investigation_count
      WHERE user_id IN (${client_1.Prisma.join(userIds)})
    `;
        const checkpointCounts = await prisma_1.prisma.$queryRaw `
      SELECT user_id, COUNT(*) as cnt
      FROM user_checkpoints
      WHERE user_id IN (${client_1.Prisma.join(userIds)})
      GROUP BY user_id
    `;
        const userIdToDailyByDay = {};
        for (const row of dailyCounts) {
            const uid = Number(row.user_id);
            const d = Number(row.day);
            const c = Number(row.count || 0);
            if (!userIdToDailyByDay[uid])
                userIdToDailyByDay[uid] = {};
            userIdToDailyByDay[uid][d] = c;
        }
        const userIdToCheckpointCount = {};
        for (const row of checkpointCounts) {
            userIdToCheckpointCount[Number(row.user_id)] = Number(row.cnt || 0);
        }
        const enriched = users.map(u => {
            const countForCurrentDay = userIdToDailyByDay[u.id]?.[u.current_day] ?? 0;
            const cpCount = userIdToCheckpointCount[u.id] ?? 0;
            return {
                ...u,
                daily_investigation_count: countForCurrentDay >= 0
                    ? [{ day: u.current_day, count: countForCurrentDay }]
                    : [],
                user_checkpoints: new Array(cpCount).fill(0)
            };
        });
        return res.status(200).json({ users: enriched, totalCount: enriched.length });
    }
    catch (error) {
        console.error('❌ 관리자 사용자 조회 오류:', error);
        return res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
    }
};
exports.getAdminUsers = getAdminUsers;
const getAdminResources = async (req, res) => {
    try {
        const { type } = req.query;
        const where = type ? { type: String(type) } : {};
        const resources = await prisma_1.prisma.resource.findMany({
            where,
            select: { id: true, name: true, description: true, type: true },
            orderBy: { id: 'asc' }
        });
        return res.status(200).json({ resources, totalCount: resources.length });
    }
    catch (error) {
        console.error('❌ 관리자 리소스 조회 오류:', error);
        return res.status(500).json({ error: '리소스 목록 조회 중 오류가 발생했습니다.' });
    }
};
exports.getAdminResources = getAdminResources;
const getAdminUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        if (!Number.isFinite(userId)) {
            return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                hp: true,
                energy: true,
                gold: true,
                attack_power: true,
                current_day: true,
                is_alive: true,
            }
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        const checkpoints = await prisma_1.prisma.$queryRaw `
      SELECT id, user_id, node_id, title, description, hp, energy, gold, saved_at
      FROM user_checkpoints
      WHERE user_id = ${userId}
      ORDER BY saved_at DESC
    `;
        const resources = await prisma_1.prisma.$queryRaw `
      SELECT ur.id, ur.quantity, r.id as resource_id, r.name, r.description, r.type
      FROM user_resources ur
      JOIN resources r ON ur.resource_id = r.id
      WHERE ur.user_id = ${userId}
      ORDER BY r.name ASC
    `;
        const user_story_items = resources
            .filter((r) => r.type === 'ITEM')
            .map((r) => ({
            id: r.id,
            quantity: r.quantity,
            story_item: {
                id: r.resource_id,
                name: r.name,
                description: r.description,
            }
        }));
        const user_story_abilities = resources
            .filter((r) => r.type === 'SKILL')
            .map((r) => ({
            id: r.id,
            quantity: r.quantity,
            story_ability: {
                id: r.resource_id,
                name: r.name,
                description: r.description,
            }
        }));
        const daily = await prisma_1.prisma.$queryRaw `
      SELECT day, count FROM daily_investigation_count
      WHERE user_id = ${userId} AND day = ${user.current_day}
      LIMIT 1
    `;
        const daily_investigation_count = daily.length > 0
            ? [{ day: daily[0].day, count: daily[0].count }]
            : [];
        const user_checkpoints = checkpoints.map((cp) => ({
            id: cp.id,
            node_id: cp.node_id,
            title: cp.title,
            description: cp.description,
            hp: cp.hp,
            energy: cp.energy,
            gold: cp.gold,
            saved_at: cp.saved_at,
        }));
        return res.status(200).json({
            user: {
                ...user,
                user_story_items,
                user_story_abilities,
                user_checkpoints,
                daily_investigation_count,
            }
        });
    }
    catch (error) {
        console.error('❌ 관리자 사용자 상세 조회 오류:', error);
        return res.status(500).json({ error: '사용자 상세 조회 중 오류가 발생했습니다.' });
    }
};
exports.getAdminUserDetail = getAdminUserDetail;
const updateAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        if (!Number.isFinite(userId)) {
            return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
        }
        const allowedFields = ['hp', 'energy', 'gold', 'attack_power', 'current_day', 'is_alive'];
        const data = {};
        for (const field of allowedFields) {
            if (field in req.body)
                data[field] = req.body[field];
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id: userId },
            data
        });
        return res.status(200).json({ user: updated });
    }
    catch (error) {
        console.error('❌ 관리자 사용자 수정 오류:', error);
        return res.status(500).json({ error: '사용자 정보를 수정하는 중 오류가 발생했습니다.' });
    }
};
exports.updateAdminUser = updateAdminUser;
const updateUserInvestigationCount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        const { day, count } = req.body;
        if (!Number.isFinite(userId) || !Number.isFinite(day) || day <= 0) {
            return res.status(400).json({ error: '유효하지 않은 파라미터입니다.' });
        }
        const existing = await prisma_1.prisma.dailyInvestigationCount.findFirst({
            where: { user_id: userId, day: Number(day) }
        });
        let result;
        if (existing) {
            result = await prisma_1.prisma.dailyInvestigationCount.update({
                where: { id: existing.id },
                data: { count: Number(count) }
            });
        }
        else {
            result = await prisma_1.prisma.dailyInvestigationCount.create({
                data: { user_id: userId, day: Number(day), count: Number(count) }
            });
        }
        return res.status(200).json({ daily_investigation_count: result });
    }
    catch (error) {
        console.error('❌ 조사 횟수 업데이트 오류:', error);
        return res.status(500).json({ error: '조사 횟수를 업데이트하는 중 오류가 발생했습니다.' });
    }
};
exports.updateUserInvestigationCount = updateUserInvestigationCount;
async function addUserResourceInternal(userId, resourceId, quantity) {
    if (!Number.isFinite(userId) || !Number.isFinite(resourceId)) {
        throw new Error('유효하지 않은 ID');
    }
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = await prisma_1.prisma.userResource.findFirst({
        where: { user_id: userId, resource_id: resourceId }
    });
    if (existing) {
        return await prisma_1.prisma.userResource.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + qty }
        });
    }
    return await prisma_1.prisma.userResource.create({
        data: { user_id: userId, resource_id: resourceId, quantity: qty }
    });
}
const addUserItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        const { resource_id, quantity } = req.body;
        const created = await addUserResourceInternal(userId, Number(resource_id), Number(quantity) || 1);
        return res.status(201).json({ user_resource: created });
    }
    catch (error) {
        console.error('❌ 아이템 추가 오류:', error);
        return res.status(500).json({ error: '아이템을 추가하는 중 오류가 발생했습니다.' });
    }
};
exports.addUserItem = addUserItem;
const addUserAbility = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(id);
        const { resource_id, quantity } = req.body;
        const created = await addUserResourceInternal(userId, Number(resource_id), Number(quantity) || 1);
        return res.status(201).json({ user_resource: created });
    }
    catch (error) {
        console.error('❌ 능력 추가 오류:', error);
        return res.status(500).json({ error: '능력을 추가하는 중 오류가 발생했습니다.' });
    }
};
exports.addUserAbility = addUserAbility;
const deleteUserResource = async (req, res) => {
    try {
        const { resourceId } = req.params;
        const id = Number(resourceId);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: '유효하지 않은 리소스 ID입니다.' });
        }
        await prisma_1.prisma.userResource.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error('❌ 사용자 리소스 삭제 오류:', error);
        return res.status(500).json({ error: '사용자 리소스를 삭제하는 중 오류가 발생했습니다.' });
    }
};
exports.deleteUserResource = deleteUserResource;
const deleteUserCheckpoint = async (req, res) => {
    try {
        const { checkpointId } = req.params;
        const id = Number(checkpointId);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: '유효하지 않은 체크포인트 ID입니다.' });
        }
        await prisma_1.prisma.userCheckpoint.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error('❌ 사용자 체크포인트 삭제 오류:', error);
        return res.status(500).json({ error: '체크포인트를 삭제하는 중 오류가 발생했습니다.' });
    }
};
exports.deleteUserCheckpoint = deleteUserCheckpoint;
//# sourceMappingURL=adminController.js.map