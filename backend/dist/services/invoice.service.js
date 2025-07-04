"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class InvoiceService {
    async createFromAppointment(appointmentId) {
        return await prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    services: true,
                    medicalRecord: {
                        include: {
                            products: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    },
                    pet: {
                        include: {
                            tutor: true
                        }
                    },
                    invoice: true
                }
            });
            if (!appointment) {
                throw new Error('Agendamento não encontrado');
            }
            if (appointment.status !== 'COMPLETED') {
                throw new Error('Só é possível gerar fatura para agendamentos finalizados');
            }
            if (appointment.invoice) {
                throw new Error('Este agendamento já possui uma fatura');
            }
            const invoice = await tx.invoice.create({
                data: {
                    appointmentId: appointmentId,
                    totalAmount: 0,
                    status: 'PENDING'
                }
            });
            const invoiceItems = [];
            let totalAmount = 0;
            for (const service of appointment.services) {
                const item = await tx.invoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        description: service.name,
                        quantity: 1,
                        unitPrice: service.price,
                        totalPrice: service.price
                    }
                });
                invoiceItems.push(item);
                totalAmount += service.price;
            }
            if (appointment.medicalRecord?.products) {
                for (const productRecord of appointment.medicalRecord.products) {
                    const item = await tx.invoiceItem.create({
                        data: {
                            invoiceId: invoice.id,
                            description: productRecord.product.name,
                            quantity: productRecord.quantityUsed,
                            unitPrice: productRecord.product.price,
                            totalPrice: productRecord.product.price * productRecord.quantityUsed
                        }
                    });
                    invoiceItems.push(item);
                    totalAmount += item.totalPrice;
                }
            }
            if (invoiceItems.length === 0) {
                const defaultItem = await tx.invoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        description: 'Consulta Veterinária',
                        quantity: 1,
                        unitPrice: 50.00,
                        totalPrice: 50.00
                    }
                });
                invoiceItems.push(defaultItem);
                totalAmount = 50.00;
            }
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoice.id },
                data: { totalAmount },
                include: {
                    items: true,
                    appointment: {
                        include: {
                            pet: {
                                include: {
                                    tutor: true
                                }
                            }
                        }
                    }
                }
            });
            return updatedInvoice;
        });
    }
    async getById(invoiceId) {
        return await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: true,
                appointment: {
                    include: {
                        pet: {
                            include: {
                                tutor: true
                            }
                        }
                    }
                }
            }
        });
    }
    async getByAppointmentId(appointmentId) {
        return await prisma.invoice.findUnique({
            where: { appointmentId },
            include: {
                items: true,
                appointment: {
                    include: {
                        pet: {
                            include: {
                                tutor: true
                            }
                        }
                    }
                }
            }
        });
    }
    async updateStatus(invoiceId, status) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });
        if (!invoice) {
            throw new Error('Fatura não encontrada');
        }
        return await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status },
            include: {
                items: true,
                appointment: {
                    include: {
                        pet: {
                            include: {
                                tutor: true
                            }
                        }
                    }
                }
            }
        });
    }
    async getAll() {
        return await prisma.invoice.findMany({
            include: {
                items: true,
                appointment: {
                    include: {
                        pet: {
                            include: {
                                tutor: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async getFinancialStats() {
        const [totalPending, totalPaid, totalCancelled, recentInvoices] = await Promise.all([
            prisma.invoice.aggregate({
                where: { status: 'PENDING' },
                _sum: { totalAmount: true },
                _count: true
            }),
            prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { totalAmount: true },
                _count: true
            }),
            prisma.invoice.aggregate({
                where: { status: 'CANCELLED' },
                _sum: { totalAmount: true },
                _count: true
            }),
            prisma.invoice.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    appointment: {
                        include: {
                            pet: {
                                include: {
                                    tutor: true
                                }
                            }
                        }
                    }
                }
            })
        ]);
        return {
            pending: {
                count: totalPending._count,
                amount: totalPending._sum.totalAmount || 0
            },
            paid: {
                count: totalPaid._count,
                amount: totalPaid._sum.totalAmount || 0
            },
            cancelled: {
                count: totalCancelled._count,
                amount: totalCancelled._sum.totalAmount || 0
            },
            recentInvoices
        };
    }
}
exports.InvoiceService = InvoiceService;
//# sourceMappingURL=invoice.service.js.map