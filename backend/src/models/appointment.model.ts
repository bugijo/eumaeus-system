export interface Appointment {
  id: number;
  petId: number;
  tutorId: number;
  appointmentDate: Date; // Campo principal do Prisma
  date: Date; // Campo adicional para compatibilidade
  time: string; // formato "HH:mm"
  status: string; // ex: "SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"
  serviceType?: string | null;
  notes?: string; // Notas opcionais
  createdAt: Date;
  updatedAt: Date;
  
  // Propriedades de relacionamento (opcionais, incluídas via Prisma include)
  pet?: {
    id: number;
    name: string;
    species?: string;
    breed?: string;
    tutor?: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
    };
  };
  tutor?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  services?: {
    name: string;
    price: number;
  }[];
}
