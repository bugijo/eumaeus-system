// Tipos baseados nos modelos do Prisma
export interface Tutor {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
  phone: string;
  address?: string;
  pets?: Pet[];
  appointments?: Appointment[];
}

export interface Pet {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  species: string;
  breed: string;
  birthDate?: Date;
  tutorId: number;
  tutor?: Tutor;
  appointments?: Appointment[];
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Appointment {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  appointmentDate: Date;
  status: AppointmentStatus;
  notes?: string;
  petId: number;
  pet?: Pet;
  tutorId: number;
  tutor?: Tutor;
  medicalRecord?: MedicalRecord;
  services?: Service[];
}

export interface MedicalRecord {
  id: number;
  petId: number;
  appointmentId: number;
  recordDate: string;
  notes: string;
  prescription: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  appointmentId: number;
  appointment?: Appointment;
}

// Tipos para formulários e operações
export interface CreateTutorData {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface UpdateTutorData extends Partial<CreateTutorData> {}

export interface CreatePetData {
  name: string;
  species: string;
  breed: string;
  birthDate?: Date;
  tutorId: number;
}

export interface UpdatePetData extends Partial<Omit<CreatePetData, 'tutorId'>> {}

export interface CreateAppointmentData {
  petId: number;
  tutorId: number;
  date: string; // formato "YYYY-MM-DD"
  time: string; // formato "HH:mm"
  serviceType: string; // ex: "Consulta", "Vacina", "Cirurgia"
  status: string; // ex: "Agendado", "Confirmado", "Cancelado"
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: AppointmentStatus;
}

export interface CreateMedicalRecordData {
  petId: number;
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  usedProducts?: {
    productId: number;
    quantityUsed: number;
  }[];
}

export interface UpdateMedicalRecordData extends Partial<Omit<CreateMedicalRecordData, 'petId' | 'appointmentId'>> {}

// Tipos para respostas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para filtros e busca
export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface TutorSearchParams extends SearchParams {}

export interface PetSearchParams extends SearchParams {
  tutorId?: number;
  species?: string;
}

export interface AppointmentSearchParams extends SearchParams {
  status?: AppointmentStatus;
  petId?: number;
  tutorId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Tipos para componentes
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}