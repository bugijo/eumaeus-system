import { ServiceType, ServiceCategory } from '../models/service.model';
export declare class ServiceService {
    private static readonly SERVICES;
    static getAllServices(): ServiceType[];
    static getServicesByCategory(): ServiceCategory[];
    static getServiceById(id: number): ServiceType | null;
    static getServicesByCategoryName(category: string): ServiceType[];
    static searchServices(query: string): ServiceType[];
}
//# sourceMappingURL=service.service.d.ts.map