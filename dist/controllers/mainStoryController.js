"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseMainStoryOption = exports.getMainStoryNode = void 0;
const getMainStoryNode = async (req, res) => {
    return res.status(501).json({
        error: '이 기능은 /api/story/node/:nodeId 로 이동되었습니다.'
    });
};
exports.getMainStoryNode = getMainStoryNode;
const chooseMainStoryOption = async (req, res) => {
    return res.status(501).json({
        error: '이 기능은 /api/story/choose 로 이동되었습니다.'
    });
};
exports.chooseMainStoryOption = chooseMainStoryOption;
//# sourceMappingURL=mainStoryController.js.map