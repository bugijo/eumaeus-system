import { AvailabilityRequest, AvailabilityResponse } from '../models/availability.model';
export declare class AvailabilityService {
    private static readonly DEFAULT_CLINIC_SETTINGS;
    static getAvailability(request: AvailabilityRequest): AvailabilityResponse;
    private static generateAllSlotsForMonth;
    private static generateSlotsForDay;
    private static getAppointmentsForMonth;
    private static markOccupiedSlots;
    static isSlotAvailable(date: string, time: string): boolean;
    private static parseTime;
    private static formatTime;
    private static formatDate;
}
//# sourceMappingURL=availability.service.d.ts.map