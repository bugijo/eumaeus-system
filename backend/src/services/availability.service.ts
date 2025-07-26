import { AvailabilityRequest, AvailabilityResponse, TimeSlot, ClinicSettings } from '../models/availability.model';
import { AppointmentService } from './appointment.service';

export class AvailabilityService {
  // Configurações padrão da clínica (futuramente virá do banco de dados)
  private static readonly DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
    workingDays: [1, 2, 3, 4, 5, 6], // Segunda a sábado
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    slotDuration: 30, // 30 minutos por consulta
    lunchBreak: {
      start: '12:00',
      end: '13:00'
    }
  };

  /**
   * Calcula os horários disponíveis para um determinado mês/ano
   */
  static getAvailability(request: AvailabilityRequest): AvailabilityResponse {
    const { year, month, serviceType } = request;
    const settings = this.DEFAULT_CLINIC_SETTINGS;
    
    // Gera todos os slots possíveis do mês
    const allSlots = this.generateAllSlotsForMonth(year, month, settings);
    
    // Busca agendamentos existentes do mês
    const existingAppointments = this.getAppointmentsForMonth(year, month);
    
    // Marca slots ocupados
    const availableSlots = this.markOccupiedSlots(allSlots, existingAppointments);
    
    return {
      year,
      month,
      availableSlots,
      workingHours: {
        start: settings.workingHours.start,
        end: settings.workingHours.end,
        slotDuration: settings.slotDuration
      }
    };
  }

  /**
   * Gera todos os slots de tempo possíveis para um mês
   */
  private static generateAllSlotsForMonth(year: number, month: number, settings: ClinicSettings): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      // Verifica se é um dia de funcionamento
      if (settings.workingDays.includes(dayOfWeek)) {
        const dateString = this.formatDate(date);
        const daySlots = this.generateSlotsForDay(dateString, settings);
        slots.push(...daySlots);
      }
    }
    
    return slots;
  }

  /**
   * Gera slots de tempo para um dia específico
   */
  private static generateSlotsForDay(date: string, settings: ClinicSettings): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = this.parseTime(settings.workingHours.start);
    const endTime = this.parseTime(settings.workingHours.end);
    const lunchStart = settings.lunchBreak ? this.parseTime(settings.lunchBreak.start) : null;
    const lunchEnd = settings.lunchBreak ? this.parseTime(settings.lunchBreak.end) : null;
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const timeString = this.formatTime(currentTime);
      
      // Verifica se não está no horário de almoço
      const isLunchTime = lunchStart && lunchEnd && 
        currentTime >= lunchStart && currentTime < lunchEnd;
      
      if (!isLunchTime) {
        slots.push({
          date,
          time: timeString,
          available: true // Inicialmente todos estão disponíveis
        });
      }
      
      // Avança para o próximo slot
      currentTime += settings.slotDuration;
    }
    
    return slots;
  }

  /**
   * Busca agendamentos existentes para um mês específico
   */
  private static getAppointmentsForMonth(year: number, month: number) {
    const allAppointments = AppointmentService.getAllAppointments();
    
    return allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getFullYear() === year && 
             appointmentDate.getMonth() === month - 1;
    });
  }

  /**
   * Marca slots como ocupados baseado nos agendamentos existentes
   */
  private static markOccupiedSlots(slots: TimeSlot[], appointments: any[]): TimeSlot[] {
    return slots.map(slot => {
      const isOccupied = appointments.some(appointment => 
        appointment.date === slot.date && appointment.time === slot.time
      );
      
      return {
        ...slot,
        available: !isOccupied
      };
    });
  }

  /**
   * Verifica se um horário específico está disponível
   */
  static isSlotAvailable(date: string, time: string): boolean {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    
    const availability = this.getAvailability({ year, month });
    const slot = availability.availableSlots.find(s => 
      s.date === date && s.time === time
    );
    
    return slot ? slot.available : false;
  }

  // Funções utilitárias
  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}