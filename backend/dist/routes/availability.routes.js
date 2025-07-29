"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_controller_1 = require("../controllers/availability.controller");
const router = (0, express_1.Router)();
router.get('/', availability_controller_1.AvailabilityController.getAvailability);
router.get('/check', availability_controller_1.AvailabilityController.checkSlotAvailability);
exports.default = router;
//# sourceMappingURL=availability.routes.js.map