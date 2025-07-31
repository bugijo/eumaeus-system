"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MedicalRecordService {
    static async getRecordsByPetId(petId) {
        try {
            const records = await prisma.medicalRecord.findMany({
                where: {
                    appointment: {
                        petId: petId
                    }
                },
                include: {
                    appointment: {
                        include: {
                            pet: { include: { tutor: true } }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return records.map(record => ({
                id: record.id,
                appointmentId: record.appointmentId,
                symptoms: record.symptoms,
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                notes: record.notes || undefined,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            }));
        }
        catch (error) {
            console.error('Erro ao buscar prontuários por pet:', error);
            throw error;
        }
    }
    static async createRecord(appointmentId, data) {
        try {
            const newRecord = await prisma.medicalRecord.create({
                data: {
                    appointmentId: appointmentId,
                    symptoms: data.symptoms,
                    diagnosis: data.diagnosis,
                    treatment: data.treatment,
                    notes: data.notes
                },
                include: {
                    appointment: {
                        include: {
                            pet: true
                        }
                    }
                }
            });
            return {
                id: newRecord.id,
                appointmentId: newRecord.appointmentId,
                symptoms: newRecord.symptoms,
                diagnosis: newRecord.diagnosis,
                treatment: newRecord.treatment,
                notes: newRecord.notes || undefined,
                createdAt: newRecord.createdAt,
                updatedAt: newRecord.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao criar prontuário:', error);
            throw error;
        }
    }
    static async getRecordById(id) {
        try {
            const record = await prisma.medicalRecord.findUnique({
                where: { id },
                include: {
                    appointment: {
                        include: {
                            pet: true
                        }
                    }
                }
            });
            if (!record)
                return null;
            return {
                id: record.id,
                appointmentId: record.appointmentId,
                symptoms: record.symptoms,
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                notes: record.notes || undefined,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao buscar prontuário por ID:', error);
            throw error;
        }
    }
    static async getAllRecords() {
        try {
            const records = await prisma.medicalRecord.findMany({
                include: {
                    appointment: {
                        include: {
                            pet: { include: { tutor: true } }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return records.map(record => ({
                id: record.id,
                appointmentId: record.appointmentId,
                symptoms: record.symptoms,
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                notes: record.notes || undefined,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            }));
        }
        catch (error) {
            console.error('Erro ao buscar todos os prontuários:', error);
            throw error;
        }
    }
    static async updateRecord(recordId, updateData) {
        try {
            const updatedRecord = await prisma.medicalRecord.update({
                where: { id: recordId },
                data: {
                    symptoms: updateData.symptoms,
                    diagnosis: updateData.diagnosis,
                    treatment: updateData.treatment,
                    notes: updateData.notes
                },
                include: {
                    appointment: {
                        include: {
                            pet: true
                        }
                    }
                }
            });
            return {
                id: updatedRecord.id,
                appointmentId: updatedRecord.appointmentId,
                symptoms: updatedRecord.symptoms,
                diagnosis: updatedRecord.diagnosis,
                treatment: updatedRecord.treatment,
                notes: updatedRecord.notes || undefined,
                createdAt: updatedRecord.createdAt,
                updatedAt: updatedRecord.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao atualizar prontuário:', error);
            if (error?.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
}
exports.MedicalRecordService = MedicalRecordService;
//# sourceMappingURL=medicalRecord.service.js.map