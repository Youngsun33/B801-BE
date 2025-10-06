"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storyController_1 = require("../controllers/storyController");
const randomStoryController_1 = require("../controllers/randomStoryController");
const investigationController_1 = require("../controllers/investigationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/action-point', auth_1.authenticateAccessToken, investigationController_1.getRemainingInvestigations);
router.get('/nodes/:nodeId', auth_1.authenticateAccessToken, storyController_1.getStoryNode);
router.post('/choose', auth_1.authenticateAccessToken, storyController_1.chooseStoryOption);
router.get('/resources', auth_1.authenticateAccessToken, storyController_1.getUserResources);
router.post('/day/:day/enter', auth_1.authenticateAccessToken, investigationController_1.enterStoryDay);
router.get('/random', auth_1.authenticateAccessToken, randomStoryController_1.getRandomStory);
router.get('/random/all', auth_1.authenticateAccessToken, randomStoryController_1.getAllRandomStories);
router.get('/random/:storyId', auth_1.authenticateAccessToken, randomStoryController_1.getRandomStoryById);
router.post('/random/:storyId/choose', auth_1.authenticateAccessToken, randomStoryController_1.chooseRandomStoryOption);
exports.default = router;
//# sourceMappingURL=story.js.map