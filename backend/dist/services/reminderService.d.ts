export interface AppointmentReminder {
    id: string;
    petName: string;
    tutorName: string;
    tutorEmail: string;
    appointmentDate: Date;
    appointmentTime: string;
    status: string;
}
export interface VaccineReminder {
    id: string;
    petName: string;
    tutorName: string;
    tutorEmail: string;
    vaccineName: string;
    lastVaccineDate: Date;
    dueDate: Date;
}
declare class ReminderService {
    findAppointmentsForTomorrow(): Promise<AppointmentReminder[]>;
    findPetsNeedingVaccineReminders(): Promise<VaccineReminder[]>;
    sendAppointmentReminders(): Promise<{
        sent: number;
        failed: number;
    }>;
    sendVaccineReminders(): Promise<{
        sent: number;
        failed: number;
    }>;
    sendAllReminders(): Promise<{
        appointments: {
            sent: number;
            failed: number;
        };
        vaccines: {
            sent: number;
            failed: number;
        };
    }>;
    testReminderSystem(): Promise<void>;
}
export declare const reminderService: ReminderService;
export default ReminderService;
//# sourceMappingURL=reminderService.d.ts.map