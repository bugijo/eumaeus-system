"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalRecordRoutes = void 0;
const express_1 = require("express");
const medicalRecordController_1 = require("../controllers/medicalRecordController");
const router = (0, express_1.Router)();
exports.medicalRecordRoutes = router;
router.post('/direct', medicalRecordController_1.createDirectMedicalRecord);
router.post('/:appointmentId', medicalRecordController_1.createMedicalRecord);
router.get('/pets/:petId/records', medicalRecordController_1.getRecordsByPet);
router.get('/appointments/:appointmentId/record', medicalRecordController_1.getRecordByAppointment);
router.get('/products', medicalRecordController_1.getAvailableProducts);
//# sourceMappingURL=medicalRecordRoutes.js.map