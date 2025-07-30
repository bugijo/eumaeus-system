import { PrismaClient } from '@prisma/client';
import { InvoiceWithRelations } from '../types';

const prisma = new PrismaClient();

export class InvoiceService {
  // Criar fatura a partir de um agendamento
  async createFromAppointment(appointmentId: number) {
    // Usar transação para garantir consistência
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar o agendamento com todos os dados necessários
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
          invoice: true // Verificar se já existe fatura
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

      // 2. Criar a fatura
      const invoice = await tx.invoice.create({
        data: {
          appointmentId: appointmentId,
          totalAmount: 0, // Será calculado depois
          status: 'PENDING'
        }
      });

      const invoiceItems = [];
      let totalAmount = 0;

      // 3. Adicionar serviços como itens da fatura
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

      // 4. Adicionar produtos utilizados como itens da fatura
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

      // 5. Se não há serviços nem produtos, criar um item padrão
      if (invoiceItems.length === 0) {
        const defaultItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: 'Consulta Veterinária',
            quantity: 1,
            unitPrice: 50.00, // Valor padrão
            totalPrice: 50.00
          }
        });
        
        invoiceItems.push(defaultItem);
        totalAmount = 50.00;
      }

      // 6. Atualizar o total da fatura
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

  // Buscar fatura por ID
  async getById(invoiceId: number): Promise<InvoiceWithRelations | null> {
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

  // Buscar fatura por ID do agendamento
  async getByAppointmentId(appointmentId: number): Promise<InvoiceWithRelations | null> {
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

  // Atualizar status da fatura
  async updateStatus(invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<InvoiceWithRelations> {
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

  // Listar todas as faturas
  async getAll(): Promise<InvoiceWithRelations[]> {
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

  // Atualizar ID da NFS-e na fatura
  async updateNFeId(invoiceId: number, nfeId: string): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: { nfeId },
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

  // Estatísticas financeiras
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