import { InvoiceWithRelations } from '../types';
export declare class InvoiceService {
    createFromAppointment(appointmentId: number): Promise<{
        appointment: {
            pet: {
                tutor: {
                    name: string;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    email: string;
                    phone: string;
                    address: string | null;
                    clinicId: number;
                    authProfileId: number | null;
                };
            } & {
                name: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                tutorId: number;
                species: string;
                breed: string;
                birthDate: Date | null;
                deletedAt: Date | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            appointmentDate: Date;
            date: Date;
            time: string;
            status: string;
            notes: string | null;
            petId: number;
            tutorId: number;
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
    getById(invoiceId: number): Promise<InvoiceWithRelations | null>;
    getByAppointmentId(appointmentId: number): Promise<InvoiceWithRelations | null>;
    updateStatus(invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<InvoiceWithRelations>;
    getAll(): Promise<InvoiceWithRelations[]>;
    updateNFeId(invoiceId: number, nfeId: string): Promise<InvoiceWithRelations>;
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
                        name: string;
                        id: number;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                        email: string;
                        phone: string;
                        address: string | null;
                        clinicId: number;
                        authProfileId: number | null;
                    };
                } & {
                    name: string;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    tutorId: number;
                    species: string;
                    breed: string;
                    birthDate: Date | null;
                    deletedAt: Date | null;
                };
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                appointmentDate: Date;
                date: Date;
                time: string;
                status: string;
                notes: string | null;
                petId: number;
                tutorId: number;
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