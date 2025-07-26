import apiClient from './apiClient';

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  available: boolean;
}

export interface AvailabilityResponse {
  year: number;
  month: number;
  availableSlots: TimeSlot[];
  workingHours: {
    start: string;
    end: string;
    slotDuration: number;
  };
}

export interface SlotAvailabilityCheck {
  date: string;
  time: string;
  available: boolean;
}

export const availabilityApi = {
  // GET /api/availability - Buscar horários disponíveis
  getAvailability: async (params: {
    year: number;
    month: number;
    serviceType?: string;
  }): Promise<AvailabilityResponse> => {
    const searchParams = new URLSearchParams({
      year: params.year.toString(),
      month: params.month.toString()
    });
    
    if (params.serviceType) {
      searchParams.append('serviceType', params.serviceType);
    }
    
    const response = await apiClient.get(`/availability?${searchParams.toString()}`);
    return response.data.data;
  },

  // GET /api/availability/check - Verificar disponibilidade de um horário específico
  checkSlotAvailability: async (params: {
    date: string;
    time: string;
  }): Promise<SlotAvailabilityCheck> => {
    const searchParams = new URLSearchParams({
      date: params.date,
      time: params.time
    });
    
    const response = await apiClient.get(`/availability/check?${searchParams.toString()}`);
    return response.data.data;
  }
};