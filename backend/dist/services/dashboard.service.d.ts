export interface DashboardStats {
    tutorCount: number;
    petCount: number;
    appointmentCount: number;
    productCount: number;
    recentAppointments: any[];
    monthlyRevenue: number;
}
export declare class DashboardService {
    static getStats(): Promise<DashboardStats>;
    static getRecentActivity(): Promise<any[]>;
}
//# sourceMappingURL=dashboard.service.d.ts.map