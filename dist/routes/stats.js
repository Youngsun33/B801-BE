"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/me/stats', auth_1.authenticateAccessToken, statsController_1.getUserStats);
exports.default = router;
//# sourceMappingURL=stats.js.map