import { Prisma } from '@prisma/client';

// Tipo para Appointment com relacionamentos incluídos
// Isso cria um tipo que representa um Agendamento E inclui automaticamente
// os tipos para 'pet' e 'tutor' que vêm do 'include'.
const appointmentWithRelations = Prisma.validator<Prisma.AppointmentDefaultArgs>()({
  include: { pet: true, tutor: true },
});

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<typeof appointmentWithRelations>;

// Tipo para Pet com relacionamentos incluídos
const petWithRelations = Prisma.validator<Prisma.PetDefaultArgs>()({
  include: { tutor: true },
});

export type PetWithRelations = Prisma.PetGetPayload<typeof petWithRelations>;

// Tipo para MedicalRecord com relacionamentos incluídos
const medicalRecordWithRelations = Prisma.validator<Prisma.MedicalRecordDefaultArgs>()({
  include: {
    appointment: {
      include: {
        pet: { include: { tutor: true } },
      },
    },
  },
});

export type MedicalRecordWithRelations = Prisma.MedicalRecordGetPayload<typeof medicalRecordWithRelations>;

// Nota: Prescription não existe no schema atual, removido temporariamente

// Tipo para Invoice com relacionamentos incluídos
const invoiceWithRelations = Prisma.validator<Prisma.InvoiceDefaultArgs>()({
  include: {
    items: true,
    appointment: {
      include: {
        pet: {
          include: {
            tutor: true
          }
        }
      }
    }
  },
});

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<typeof invoiceWithRelations>;

// Tipo para Tutor com relacionamentos incluídos
const tutorWithRelations = Prisma.validator<Prisma.TutorDefaultArgs>()({
  include: {
    pets: true,
    appointments: true
  },
});

export type TutorWithRelations = Prisma.TutorGetPayload<typeof tutorWithRelations>;