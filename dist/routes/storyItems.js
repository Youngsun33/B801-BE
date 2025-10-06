"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const storyItemController_1 = require("../controllers/storyItemController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateAccessToken, storyItemController_1.getUserStoryItems);
exports.default = router;
//# sourceMappingURL=storyItems.js.map