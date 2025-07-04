export interface AppointmentProductUsage {
    id: number;
    appointmentId: number;
    productId: number;
    quantityUsed: number;
    usedAt: string;
}
export interface CreateAppointmentProductUsageData {
    appointmentId: number;
    productId: number;
    quantityUsed: number;
}
export interface ProductUsageRequest {
    productId: number;
    quantityUsed: number;
}
export interface RegisterProductUsageRequest {
    products: ProductUsageRequest[];
}
//# sourceMappingURL=appointmentProductUsage.model.d.ts.map