"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const abilityController_1 = require("../controllers/abilityController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateAccessToken, abilityController_1.getUserAbilities);
router.get('/all', auth_1.authenticateAccessToken, abilityController_1.getAllAbilities);
router.post('/toggle', auth_1.authenticateAccessToken, abilityController_1.toggleAbility);
exports.default = router;
//# sourceMappingURL=abilities.js.map