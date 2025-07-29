import { Appointment } from '../models/appointment.model';
export declare class AppointmentService {
    static getAllAppointments(): Promise<Appointment[]>;
    static createAppointment(newAppointmentData: any): Promise<Appointment>;
    private static mapStatusToLegacy;
    static getAppointmentById(id: number): Promise<Appointment | null>;
    static updateAppointment(id: number, updateData: Partial<Omit<Appointment, 'id'>>): Promise<Appointment | null>;
    static deleteAppointment(id: number): Promise<boolean>;
    static updateAppointmentStatus(id: number, status: string): Promise<Appointment | null>;
}
//# sourceMappingURL=appointment.service.d.ts.map