"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const investigationController_1 = require("../controllers/investigationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateAccessToken);
router.post('/start', investigationController_1.startInvestigation);
router.get('/session', investigationController_1.getCurrentSession);
router.post('/update', investigationController_1.updateSessionStats);
router.post('/end', investigationController_1.endInvestigation);
router.get('/remaining', investigationController_1.getRemainingInvestigations);
exports.default = router;
//# sourceMappingURL=investigation.js.map