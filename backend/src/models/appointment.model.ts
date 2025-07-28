export interface Appointment {
  id: number;
  petId: number;
  tutorId: number;
  appointmentDate: Date; // Campo principal do Prisma
  date: Date; // Campo adicional para compatibilidade
  time: string; // formato "HH:mm"
  status: string; // ex: "SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"
  notes?: string; // Notas opcionais
  createdAt: Date;
  updatedAt: Date;
}