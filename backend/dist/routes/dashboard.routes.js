"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = __importDefault(require("../controllers/dashboardController"));
const router = (0, express_1.Router)();
router.get('/stats', dashboardController_1.default.getStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map