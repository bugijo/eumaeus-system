export interface ServiceType {
    id: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
    category: string;
    active: boolean;
}
export interface ServiceCategory {
    name: string;
    services: ServiceType[];
}
//# sourceMappingURL=service.model.d.ts.map