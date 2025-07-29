export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export interface ReminderEmailData {
    tutorName: string;
    petName: string;
    appointmentDate: string;
    appointmentTime: string;
    clinicName?: string;
    clinicPhone?: string;
}
export interface VaccineReminderData {
    tutorName: string;
    petName: string;
    vaccineName: string;
    dueDate: string;
    clinicName?: string;
    clinicPhone?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendAppointmentReminder(email: string, data: ReminderEmailData): Promise<boolean>;
    sendVaccineReminder(email: string, data: VaccineReminderData): Promise<boolean>;
    testConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=emailService.d.ts.map