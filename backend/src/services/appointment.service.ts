import { Appointment } from '../models/appointment.model';

export class AppointmentService {
  static getAllAppointments(): Appointment[] {
    return [
      {
        id: 1,
        petId: 1,
        tutorId: 1,
        date: '2025-01-15',
        time: '09:00',
        serviceType: 'Consulta',
        status: 'Agendado'
      },
      {
        id: 2,
        petId: 2,
        tutorId: 2,
        date: '2025-01-16',
        time: '14:30',
        serviceType: 'Vacina',
        status: 'Confirmado'
      },
      {
        id: 3,
        petId: 3,
        tutorId: 1,
        date: '2025-01-17',
        time: '10:15',
        serviceType: 'Cirurgia',
        status: 'Agendado'
      },
      {
        id: 4,
        petId: 4,
        tutorId: 3,
        date: '2025-01-18',
        time: '16:00',
        serviceType: 'Consulta',
        status: 'Confirmado'
      }
    ];
  }

  static createAppointment(newAppointmentData: Omit<Appointment, 'id'>): Appointment {
    console.log('Recebido para criação de agendamento:', newAppointmentData);
    
    const createdAppointment: Appointment = {
      id: Math.floor(Math.random() * 1000) + 100,
      ...newAppointmentData
    };
    
    console.log('Agendamento criado:', createdAppointment);
    return createdAppointment;
  }

  static getAppointmentById(id: number): Appointment | null {
    const appointments = this.getAllAppointments();
    const appointment = appointments.find(appointment => appointment.id === id);
    
    if (!appointment) {
      return null;
    }
    
    console.log('Agendamento encontrado:', appointment);
    return appointment;
  }

  static updateAppointment(id: number, updateData: Partial<Omit<Appointment, 'id'>>): Appointment | null {
    const appointments = this.getAllAppointments();
    const appointmentIndex = appointments.findIndex(appointment => appointment.id === id);
    
    if (appointmentIndex === -1) {
      return null;
    }
    
    const updatedAppointment: Appointment = {
      ...appointments[appointmentIndex],
      ...updateData
    };
    
    console.log('Agendamento atualizado:', updatedAppointment);
    return updatedAppointment;
  }

  static deleteAppointment(id: number): boolean {
    const appointments = this.getAllAppointments();
    const appointmentIndex = appointments.findIndex(appointment => appointment.id === id);
    
    if (appointmentIndex === -1) {
      return false;
    }
    
    console.log('Agendamento deletado com ID:', id);
    return true;
  }

  static updateAppointmentStatus(id: number, status: string): Appointment | null {
    const appointments = this.getAllAppointments();
    const appointmentIndex = appointments.findIndex(appointment => appointment.id === id);
    
    if (appointmentIndex === -1) {
      return null;
    }
    
    const updatedAppointment: Appointment = {
      ...appointments[appointmentIndex],
      status
    };
    
    console.log('Status do agendamento atualizado:', updatedAppointment);
    return updatedAppointment;
  }
}