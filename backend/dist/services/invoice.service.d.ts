export declare class InvoiceService {
    createFromAppointment(appointmentId: number): Promise<{
        appointment: {
            pet: {
                tutor: {
                    id: number;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                species: string;
                breed: string;
                tutorId: number;
                createdAt: Date;
                updatedAt: Date;
                birthDate: Date | null;
            };
        } & {
            id: number;
            tutorId: number;
            petId: number;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
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
        status: import(".prisma/client").$Enums.InvoiceStatus;
        appointmentId: number;
        createdAt: Date;
        totalAmount: number;
    }>;
    getById(invoiceId: number): Promise<({
        appointment: {
            pet: {
                tutor: {
                    id: number;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                species: string;
                breed: string;
                tutorId: number;
                createdAt: Date;
                updatedAt: Date;
                birthDate: Date | null;
            };
        } & {
            id: number;
            tutorId: number;
            petId: number;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
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
        status: import(".prisma/client").$Enums.InvoiceStatus;
        appointmentId: number;
        createdAt: Date;
        totalAmount: number;
    }) | null>;
    getByAppointmentId(appointmentId: number): Promise<({
        appointment: {
            pet: {
                tutor: {
                    id: number;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                species: string;
                breed: string;
                tutorId: number;
                createdAt: Date;
                updatedAt: Date;
                birthDate: Date | null;
            };
        } & {
            id: number;
            tutorId: number;
            petId: number;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
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
        status: import(".prisma/client").$Enums.InvoiceStatus;
        appointmentId: number;
        createdAt: Date;
        totalAmount: number;
    }) | null>;
    updateStatus(invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<{
        appointment: {
            pet: {
                tutor: {
                    id: number;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                species: string;
                breed: string;
                tutorId: number;
                createdAt: Date;
                updatedAt: Date;
                birthDate: Date | null;
            };
        } & {
            id: number;
            tutorId: number;
            petId: number;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
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
        status: import(".prisma/client").$Enums.InvoiceStatus;
        appointmentId: number;
        createdAt: Date;
        totalAmount: number;
    }>;
    getAll(): Promise<({
        appointment: {
            pet: {
                tutor: {
                    id: number;
                    name: string;
                    email: string;
                    phone: string;
                    address: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                species: string;
                breed: string;
                tutorId: number;
                createdAt: Date;
                updatedAt: Date;
                birthDate: Date | null;
            };
        } & {
            id: number;
            tutorId: number;
            petId: number;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
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
        status: import(".prisma/client").$Enums.InvoiceStatus;
        appointmentId: number;
        createdAt: Date;
        totalAmount: number;
    })[]>;
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
                        id: number;
                        name: string;
                        email: string;
                        phone: string;
                        address: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                } & {
                    id: number;
                    name: string;
                    species: string;
                    breed: string;
                    tutorId: number;
                    createdAt: Date;
                    updatedAt: Date;
                    birthDate: Date | null;
                };
            } & {
                id: number;
                tutorId: number;
                petId: number;
                status: import(".prisma/client").$Enums.AppointmentStatus;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                appointmentDate: Date;
            };
        } & {
            id: number;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            appointmentId: number;
            createdAt: Date;
            totalAmount: number;
        })[];
    }>;
}
//# sourceMappingURL=invoice.service.d.ts.map