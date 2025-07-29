"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const router = (0, express_1.Router)();
router.get('/', service_controller_1.ServiceController.getAllServices);
router.get('/categories', service_controller_1.ServiceController.getServicesByCategory);
router.get('/:id', service_controller_1.ServiceController.getServiceById);
exports.default = router;
//# sourceMappingURL=service.routes.js.map