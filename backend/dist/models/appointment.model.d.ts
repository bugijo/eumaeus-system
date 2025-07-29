export interface Appointment {
    id: number;
    petId: number;
    tutorId: number;
    appointmentDate: Date;
    date: Date;
    time: string;
    status: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    pet?: {
        id: number;
        name: string;
        species?: string;
        breed?: string;
        tutor?: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        };
    };
    tutor?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    };
    services?: {
        name: string;
        price: number;
    }[];
}
//# sourceMappingURL=appointment.model.d.ts.map