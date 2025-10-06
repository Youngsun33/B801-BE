"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mainStoryController_1 = require("../controllers/mainStoryController");
const router = (0, express_1.Router)();
router.get('/node/:nodeId', auth_1.authenticateAccessToken, mainStoryController_1.getMainStoryNode);
router.post('/choose', auth_1.authenticateAccessToken, mainStoryController_1.chooseMainStoryOption);
exports.default = router;
//# sourceMappingURL=mainStory.js.map