"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMainStory = seedMainStory;
const prisma_1 = require("./prisma");
const parseTwineToMainStory_1 = require("./parseTwineToMainStory");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function seedMainStory() {
    try {
        console.log('🌱 메인 스토리 시딩 시작...');
        await prisma_1.prisma.mainStory.deleteMany({});
        console.log('✅ 기존 메인 스토리 삭제 완료');
        const twineFilePath = path.join(__dirname, '../data/mainStory.twine.txt');
        const twineContent = fs.readFileSync(twineFilePath, 'utf-8');
        const parsedStories = (0, parseTwineToMainStory_1.parseTwineDocument)(twineContent);
        console.log(`📖 ${parsedStories.length}개의 스토리 노드 파싱 완료`);
        for (const story of parsedStories) {
            await prisma_1.prisma.mainStory.create({
                data: story
            });
        }
        console.log('✅ 메인 스토리 시딩 완료!');
        console.log(`📊 총 ${parsedStories.length}개의 노드가 저장되었습니다.`);
    }
    catch (error) {
        console.error('❌ 메인 스토리 시딩 중 오류:', error);
        throw error;
    }
}
if (require.main === module) {
    seedMainStory()
        .then(() => {
        console.log('완료!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('실패:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seedMainStory.js.map