import { AppointmentProductUsage, ProductUsageRequest } from '../models/appointmentProductUsage.model';
export declare class AppointmentProductUsageService {
    static registerProductUsage(appointmentId: number, products: ProductUsageRequest[]): Promise<{
        success: boolean;
        message: string;
        usages?: AppointmentProductUsage[];
    }>;
    static getUsagesByAppointment(appointmentId: number): Promise<AppointmentProductUsage[]>;
    static getAllUsages(): Promise<AppointmentProductUsage[]>;
    static getUsageById(id: number): Promise<AppointmentProductUsage | null>;
}
//# sourceMappingURL=appointmentProductUsage.service.d.ts.map