"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateAccessToken, inventoryController_1.getInventory);
router.post('/:inventoryId/use', auth_1.authenticateAccessToken, inventoryController_1.useStoryItem);
router.delete('/:inventoryId', auth_1.authenticateAccessToken, inventoryController_1.deleteStoryItem);
exports.default = router;
//# sourceMappingURL=inventory.js.map