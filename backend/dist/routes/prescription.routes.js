"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prescription_controller_1 = require("../controllers/prescription.controller");
const router = (0, express_1.Router)();
router.post('/records/:recordId/prescriptions', prescription_controller_1.PrescriptionController.createPrescription);
router.get('/records/:recordId/prescriptions', prescription_controller_1.PrescriptionController.getPrescriptionByMedicalRecord);
router.get('/prescriptions/:id', prescription_controller_1.PrescriptionController.getPrescriptionById);
router.put('/prescriptions/:id', prescription_controller_1.PrescriptionController.updatePrescription);
router.delete('/prescriptions/:id', prescription_controller_1.PrescriptionController.deletePrescription);
router.get('/prescriptions', prescription_controller_1.PrescriptionController.getAllPrescriptions);
exports.default = router;
//# sourceMappingURL=prescription.routes.js.map