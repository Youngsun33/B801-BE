"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const checkpointController_1 = require("../controllers/checkpointController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateAccessToken, checkpointController_1.getUserCheckpoints);
router.post('/load', auth_1.authenticateAccessToken, checkpointController_1.loadCheckpoint);
exports.default = router;
//# sourceMappingURL=checkpoints.js.map