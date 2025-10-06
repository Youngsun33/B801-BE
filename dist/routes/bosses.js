"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bossController_1 = require("../controllers/bossController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/:bossId', auth_1.authenticateAccessToken, bossController_1.getBossData);
exports.default = router;
//# sourceMappingURL=bosses.js.map