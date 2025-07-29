import { PrismaClient } from '@prisma/client';
import { CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionResponse } from '../models/prescription.model';

const prisma = new PrismaClient();

// NOTA: Prescription model não existe no schema atual - temporariamente desabilitado
export class PrescriptionService {
  static async createPrescription(data: CreatePrescriptionRequest): Promise<PrescriptionResponse> {
    // TODO: Implementar quando o modelo Prescription for adicionado ao schema
    throw new Error('Prescription model não implementado no schema atual');
  }

  static async getPrescriptionById(id: number): Promise<PrescriptionResponse | null> {
    throw new Error('Prescription model não implementado no schema atual');
  }

  static async getPrescriptionByMedicalRecordId(medicalRecordId: number): Promise<PrescriptionResponse | null> {
    throw new Error('Prescription model não implementado no schema atual');
  }

  static async updatePrescription(id: number, data: UpdatePrescriptionRequest): Promise<PrescriptionResponse | null> {
    throw new Error('Prescription model não implementado no schema atual');
  }

  static async deletePrescription(id: number): Promise<boolean> {
    throw new Error('Prescription model não implementado no schema atual');
  }

  static async getAllPrescriptions(): Promise<PrescriptionResponse[]> {
    throw new Error('Prescription model não implementado no schema atual');
  }
}