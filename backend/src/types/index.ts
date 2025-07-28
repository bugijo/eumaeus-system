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