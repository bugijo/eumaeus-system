"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
router.get('/stats', dashboardController_1.dashboardController.getStats);
router.get('/upcoming-appointments', dashboardController_1.dashboardController.getUpcomingAppointments);
router.get('/recent-activities', dashboardController_1.dashboardController.getRecentActivities);
router.get('/activity', dashboardController_1.dashboardController.getRecentActivity);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map