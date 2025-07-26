import { PrismaClient } from '@prisma/client';
import { CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionResponse } from '../models/prescription.model';

const prisma = new PrismaClient();

export class PrescriptionService {
  static async createPrescription(data: CreatePrescriptionRequest): Promise<PrescriptionResponse> {
    try {
      // Verificar se o prontuário existe
      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { id: data.medicalRecordId },
        include: {
          appointment: {
            include: {
              pet: {
                include: {
                  tutor: true
                }
              }
            }
          }
        }
      });

      if (!medicalRecord) {
        throw new Error('Prontuário médico não encontrado');
      }

      // Verificar se já existe uma receita para este prontuário
      const existingPrescription = await prisma.prescription.findUnique({
        where: { medicalRecordId: data.medicalRecordId }
      });

      if (existingPrescription) {
        throw new Error('Já existe uma receita para este prontuário');
      }

      // Criar a receita com os itens
      const prescription = await prisma.prescription.create({
        data: {
          medicalRecordId: data.medicalRecordId,
          items: {
            create: data.items.map(item => ({
              medication: item.medication,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions
            }))
          }
        },
        include: {
          items: true,
          medicalRecord: {
            include: {
              appointment: {
                include: {
                  pet: {
                    include: {
                      tutor: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return prescription;
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      throw error;
    }
  }

  static async getPrescriptionById(id: number): Promise<PrescriptionResponse | null> {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          items: true,
          medicalRecord: {
            include: {
              appointment: {
                include: {
                  pet: {
                    include: {
                      tutor: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return prescription;
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      throw error;
    }
  }

  static async getPrescriptionByMedicalRecordId(medicalRecordId: number): Promise<PrescriptionResponse | null> {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { medicalRecordId },
        include: {
          items: true,
          medicalRecord: {
            include: {
              appointment: {
                include: {
                  pet: {
                    include: {
                      tutor: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return prescription;
    } catch (error) {
      console.error('Erro ao buscar receita por prontuário:', error);
      throw error;
    }
  }

  static async updatePrescription(id: number, data: UpdatePrescriptionRequest): Promise<PrescriptionResponse | null> {
    try {
      // Verificar se a receita existe
      const existingPrescription = await prisma.prescription.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingPrescription) {
        throw new Error('Receita não encontrada');
      }

      // Deletar itens existentes e criar novos
      await prisma.prescriptionItem.deleteMany({
        where: { prescriptionId: id }
      });

      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: {
          items: {
            create: data.items.map(item => ({
              medication: item.medication,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions
            }))
          }
        },
        include: {
          items: true,
          medicalRecord: {
            include: {
              appointment: {
                include: {
                  pet: {
                    include: {
                      tutor: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return updatedPrescription;
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      throw error;
    }
  }

  static async deletePrescription(id: number): Promise<boolean> {
    try {
      // Deletar itens primeiro (devido à relação)
      await prisma.prescriptionItem.deleteMany({
        where: { prescriptionId: id }
      });

      // Deletar a receita
      await prisma.prescription.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      throw error;
    }
  }

  static async getAllPrescriptions(): Promise<PrescriptionResponse[]> {
    try {
      const prescriptions = await prisma.prescription.findMany({
        include: {
          items: true,
          medicalRecord: {
            include: {
              appointment: {
                include: {
                  pet: {
                    include: {
                      tutor: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return prescriptions;
    } catch (error) {
      console.error('Erro ao buscar todas as receitas:', error);
      throw error;
    }
  }
}