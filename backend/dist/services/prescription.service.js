"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrescriptionService {
    static async createPrescription(data) {
        throw new Error('Prescription model não implementado no schema atual');
    }
    static async getPrescriptionById(id) {
        throw new Error('Prescription model não implementado no schema atual');
    }
    static async getPrescriptionByMedicalRecordId(medicalRecordId) {
        throw new Error('Prescription model não implementado no schema atual');
    }
    static async updatePrescription(id, data) {
        throw new Error('Prescription model não implementado no schema atual');
    }
    static async deletePrescription(id) {
        throw new Error('Prescription model não implementado no schema atual');
    }
    static async getAllPrescriptions() {
        throw new Error('Prescription model não implementado no schema atual');
    }
}
exports.PrescriptionService = PrescriptionService;
//# sourceMappingURL=prescription.service.js.map