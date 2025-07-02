import type { Appointment, CreateAppointmentData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export class AppointmentService {
  static async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const appointment: Appointment = await response.json();
      return appointment;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw new Error('Falha ao criar agendamento');
    }
  }

  static async findAll(): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const appointments: Appointment[] = await response.json();
      return appointments;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new Error('Falha ao buscar agendamentos');
    }
  }

  static async findById(id: number): Promise<Appointment | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const appointment: Appointment = await response.json();
      return appointment;
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      throw new Error('Falha ao buscar agendamento');
    }
  }

  static async update(id: number, data: Partial<CreateAppointmentData>): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.status === 404) {
        throw new Error('Agendamento não encontrado');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const appointment: Appointment = await response.json();
      return appointment;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw new Error('Falha ao atualizar agendamento');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'DELETE',
      });
      
      if (response.status === 404) {
        throw new Error('Agendamento não encontrado');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw new Error('Falha ao deletar agendamento');
    }
  }
}