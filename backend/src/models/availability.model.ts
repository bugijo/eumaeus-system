export interface TimeSlot {
  date: string; // formato "YYYY-MM-DD"
  time: string; // formato "HH:mm"
  available: boolean;
}

export interface AvailabilityRequest {
  year: number;
  month: number; // 1-12
  serviceType?: string;
}

export interface AvailabilityResponse {
  year: number;
  month: number;
  availableSlots: TimeSlot[];
  workingHours: {
    start: string; // formato "HH:mm"
    end: string; // formato "HH:mm"
    slotDuration: number; // em minutos
  };
}

export interface ClinicSettings {
  workingDays: number[]; // 0=domingo, 1=segunda, ..., 6=sábado
  workingHours: {
    start: string; // formato "HH:mm"
    end: string; // formato "HH:mm"
  };
  slotDuration: number; // duração de cada slot em minutos
  lunchBreak?: {
    start: string;
    end: string;
  };
}