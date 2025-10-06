"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const storyAbilityController_1 = require("../controllers/storyAbilityController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateAccessToken, storyAbilityController_1.getUserStoryAbilities);
router.get('/all', auth_1.authenticateAccessToken, storyAbilityController_1.getAllStoryAbilities);
exports.default = router;
//# sourceMappingURL=storyAbilities.js.map