export interface TimeSlot {
    date: string;
    time: string;
    available: boolean;
}
export interface AvailabilityRequest {
    year: number;
    month: number;
    serviceType?: string;
}
export interface AvailabilityResponse {
    year: number;
    month: number;
    availableSlots: TimeSlot[];
    workingHours: {
        start: string;
        end: string;
        slotDuration: number;
    };
}
export interface ClinicSettings {
    workingDays: number[];
    workingHours: {
        start: string;
        end: string;
    };
    slotDuration: number;
    lunchBreak?: {
        start: string;
        end: string;
    };
}
//# sourceMappingURL=availability.model.d.ts.map