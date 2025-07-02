export interface AppointmentProductUsage {
  id: number;
  appointmentId: number;
  productId: number;
  quantityUsed: number;
  usedAt: string; // formato "YYYY-MM-DD HH:mm:ss"
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