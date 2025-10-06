"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const router = (0, express_1.Router)();
router.get('/time', systemController_1.getServerTime);
router.get('/phase', systemController_1.getCurrentPhaseInfo);
router.get('/schedule', systemController_1.getTodaySchedule);
router.get('/notices', systemController_1.getNotices);
exports.default = router;
//# sourceMappingURL=system.js.map