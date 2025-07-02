import { Appointment } from '../models/appointment.model';
export declare class AppointmentService {
    static getAllAppointments(): Appointment[];
    static createAppointment(newAppointmentData: Omit<Appointment, 'id'>): Appointment;
    static getAppointmentById(id: number): Appointment | null;
    static updateAppointment(id: number, updateData: Partial<Omit<Appointment, 'id'>>): Appointment | null;
    static deleteAppointment(id: number): boolean;
}
//# sourceMappingURL=appointment.service.d.ts.map