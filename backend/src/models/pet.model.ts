export interface Pet {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  name: string;
  species: string;
  breed: string;
  birthDate: Date | null;
  weight?: number;
  color?: string;
  microchip?: string;
  notes?: string;
  tutorId: number;
  tutor?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}