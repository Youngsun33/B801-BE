"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shopController_1 = require("../controllers/shopController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/status', auth_1.authenticateAccessToken, shopController_1.getShopStatus);
router.get('/items', auth_1.authenticateAccessToken, shopController_1.getShopItems);
router.post('/purchase', auth_1.authenticateAccessToken, shopController_1.purchaseItem);
exports.default = router;
//# sourceMappingURL=shop.js.map