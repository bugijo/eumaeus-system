"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicalRecord_controller_1 = require("../controllers/medicalRecord.controller");
const router = (0, express_1.Router)();
router.get('/pets/:petId/records', medicalRecord_controller_1.MedicalRecordController.getRecordsByPetId);
router.post('/appointments/:appointmentId/records', medicalRecord_controller_1.MedicalRecordController.createRecord);
router.get('/records/:id', medicalRecord_controller_1.MedicalRecordController.getRecordById);
router.get('/records', medicalRecord_controller_1.MedicalRecordController.getAllRecords);
router.get('/records/:recordId', medicalRecord_controller_1.MedicalRecordController.getRecordById);
router.put('/records/:recordId', medicalRecord_controller_1.MedicalRecordController.updateRecord);
exports.default = router;
//# sourceMappingURL=medicalRecord.routes.js.map