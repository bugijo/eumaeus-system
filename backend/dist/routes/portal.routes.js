"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const portal_controller_1 = __importDefault(require("../controllers/portal.controller"));
const router = (0, express_1.Router)();
exports.portalRoutes = router;
router.use(auth_middleware_1.authenticateTutor);
router.get('/my-pets', portal_controller_1.default.getMyPets);
router.get('/my-pets/:petId', portal_controller_1.default.getMyPetById);
router.get('/my-appointments', portal_controller_1.default.getMyAppointments);
router.post('/my-appointments', portal_controller_1.default.createAppointment);
router.get('/pets/:petId/records', portal_controller_1.default.getPetMedicalHistory);
router.get('/my-profile', portal_controller_1.default.getMyProfile);
router.put('/my-profile', portal_controller_1.default.updateMyProfile);
//# sourceMappingURL=portal.routes.js.map