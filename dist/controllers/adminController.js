"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.getAdminStats = exports.createStoryNode = exports.deleteStoryNode = exports.updateStoryNode = exports.getStoryNodes = exports.importTwineFile = void 0;
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
const getAdminStats = async (req, res) => {
    try {
        const userCount = await prisma_1.prisma.user.count();
        const storyNodeResult = await prisma_1.prisma.$queryRaw `
      SELECT COUNT(*) as count FROM nodes
    `;
        const storyNodeCount = storyNodeResult[0]?.count || 0;
        const activeUsers = userCount;
        return res.status(200).json({
            stats: {
                totalUsers: userCount,
                activeUsers: activeUsers,
                storyNodes: storyNodeCount,
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
//# sourceMappingURL=adminController.js.map