"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rewardController_1 = require("../controllers/rewardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/day/:day', auth_1.authenticateAccessToken, rewardController_1.getDayLeaderboard);
exports.default = router;
//# sourceMappingURL=leaderboards.js.map