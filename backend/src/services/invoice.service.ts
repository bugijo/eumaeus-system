import { InvoiceWithRelations } from '../types';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

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
          packageSessions: { where: { reversedAt: null }, include: { service: true } },
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
      let totalAmount = new Prisma.Decimal(0);

      // 3. Adicionar serviços como itens da fatura
      for (const service of appointment.services) {
        const packageSession = appointment.packageSessions.find((session: any) => session.serviceId === service.id);
        const ambiguousSession = appointment.packageSessions.find((session: any) => session.serviceId === null);
        if (ambiguousSession) throw new Error('Sessão de pacote sem serviço vinculado; faturamento bloqueado até resolução autorizada');
        const item = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: service.name,
            quantity: 1,
            unitPrice: packageSession ? new Prisma.Decimal(0) : service.price,
            totalPrice: packageSession ? new Prisma.Decimal(0) : new Prisma.Decimal(service.price),
            serviceId: service.id,
            packageSessionId: packageSession?.id,
            coveredByPackage: Boolean(packageSession),
          }
        });
        
        invoiceItems.push(item);
        totalAmount = totalAmount.plus(item.totalPrice);
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
              totalPrice: new Prisma.Decimal(productRecord.product.price).mul(productRecord.quantityUsed)
            }
          });
          
          invoiceItems.push(item);
          totalAmount = totalAmount.plus(item.totalPrice);
        }
      }

      // 5. Se não há serviços nem produtos, criar um item padrão
      if (invoiceItems.length === 0) {
        throw new Error('Não é possível faturar um atendimento sem serviço ou produto contratado');
      }

      // 6. Atualizar o total da fatura
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { totalAmount },
        include: {
          items: true,
          discounts: true,
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
        discounts: true,
        payments: true,
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
        discounts: true,
        payments: true,
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
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    if (status === 'PAID') {
      throw new Error('Fatura só pode ser marcada como paga por recebimentos POSTED');
    }
    if (status === 'CANCELLED' && invoice.payments.some((payment: any) => payment.status === 'POSTED')) {
      throw new Error('Fatura com recebimentos POSTED não pode ser cancelada');
    }

    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, cancelledAt: status === 'CANCELLED' ? new Date() : null },
      include: {
        items: true,
        discounts: true,
        payments: true,
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

  async applyDiscount(invoiceId: number, amount: number, reason: string, authorizedByUserId: number): Promise<InvoiceWithRelations> {
    if (!Number.isFinite(amount) || amount <= 0 || !reason?.trim()) throw new Error('Valor e justificativa do desconto são obrigatórios');
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, discounts: true } });
      if (!invoice) throw new Error('Fatura não encontrada');
      if (invoice.status !== 'PENDING') throw new Error('Só é possível aplicar desconto em fatura pendente');
      const subtotal = invoice.items.reduce((sum, item) => sum.plus(item.totalPrice), new Prisma.Decimal(0));
      const existing = invoice.discounts.reduce((sum, discount) => sum.plus(discount.amount), new Prisma.Decimal(0));
      const discount = new Prisma.Decimal(amount);
      if (existing.plus(discount).greaterThan(subtotal)) throw new Error('Desconto maior que o total da fatura');
      await tx.invoiceDiscount.create({ data: { invoiceId, clinicId: invoice.clinicId, amount: discount, reason: reason.trim(), authorizedByUserId } });
      const totalAmount = subtotal.minus(existing).minus(discount);
      return tx.invoice.update({ where: { id: invoiceId }, data: { totalAmount }, include: { items: true, discounts: true, payments: true, appointment: { include: { pet: { include: { tutor: true } } } } } });
    });
  }

  // Listar todas as faturas
  async getAll(): Promise<InvoiceWithRelations[]> {
    return await prisma.invoice.findMany({
      include: {
        items: true,
        discounts: true,
        payments: true,
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
        discounts: true,
        payments: true,
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
        amount: Number(totalPending._sum.totalAmount || 0)
      },
      paid: {
        count: totalPaid._count,
        amount: Number(totalPaid._sum.totalAmount || 0)
      },
      cancelled: {
        count: totalCancelled._count,
        amount: Number(totalCancelled._sum.totalAmount || 0)
      },
      recentInvoices
    };
  }
}
