import apiClient from '../api/apiClient';
import type { Appointment, CreateAppointmentData } from '../types';

export class AppointmentService {
  static async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const response = await apiClient.post('/appointments', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw new Error('Falha ao criar agendamento');
    }
  }

  static async findAll(): Promise<Appointment[]> {
    try {
      const response = await apiClient.get('/appointments');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new Error('Falha ao buscar agendamentos');
    }
  }

  static async findById(id: number): Promise<Appointment | null> {
    try {
      const response = await apiClient.get(`/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar agendamento:', error);
      throw new Error('Falha ao buscar agendamento');
    }
  }

  static async update(id: number, data: Partial<CreateAppointmentData>): Promise<Appointment> {
    try {
      const response = await apiClient.put(`/appointments/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Agendamento não encontrado');
      }
      console.error('Erro ao atualizar agendamento:', error);
      throw new Error('Falha ao atualizar agendamento');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/appointments/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Agendamento não encontrado');
      }
      console.error('Erro ao deletar agendamento:', error);
      throw new Error('Falha ao deletar agendamento');
    }
  }
}