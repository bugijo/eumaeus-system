export declare class InvoiceService {
    createFromAppointment(appointmentId: number): Promise<{
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    }>;
    getById(invoiceId: number): Promise<({
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    }) | null>;
    getByAppointmentId(appointmentId: number): Promise<({
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    }) | null>;
    updateStatus(invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<{
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    }>;
    getAll(): Promise<({
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    })[]>;
    updateNFeId(invoiceId: number, nfeId: string): Promise<{
        appointment: {
            pet: {
                tutor: {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                deletedAt: Date | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                species: string;
                breed: string;
                birthDate: Date | null;
                tutorId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            tutorId: number;
            notes: string | null;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            petId: number;
        };
        items: {
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        status: string;
        appointmentId: number;
        totalAmount: number;
        nfeId: string | null;
    }>;
    getFinancialStats(): Promise<{
        pending: {
            count: number;
            amount: number;
        };
        paid: {
            count: number;
            amount: number;
        };
        cancelled: {
            count: number;
            amount: number;
        };
        recentInvoices: ({
            appointment: {
                pet: {
                    tutor: {
                        deletedAt: Date | null;
                        id: number;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        email: string;
                        phone: string;
                        address: string | null;
                        clinicId: number;
                        authProfileId: number | null;
                    };
                } & {
                    deletedAt: Date | null;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    species: string;
                    breed: string;
                    birthDate: Date | null;
                    tutorId: number;
                };
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                tutorId: number;
                notes: string | null;
                appointmentDate: Date;
                date: Date;
                time: string;
                status: string;
                petId: number;
            };
        } & {
            id: number;
            createdAt: Date;
            status: string;
            appointmentId: number;
            totalAmount: number;
            nfeId: string | null;
        })[];
    }>;
}
//# sourceMappingURL=invoice.service.d.ts.map