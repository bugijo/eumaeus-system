import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// Schema de validação para criação de prontuário
const createMedicalRecordSchema = z.object({
  symptoms: z.string().min(1, 'Sintomas são obrigatórios'),
  diagnosis: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatment: z.string().min(1, 'Tratamento é obrigatório'),
  notes: z.string().optional(),
  products: z.array(z.object({
    productId: z.number(),
    quantityUsed: z.number().min(1, 'Quantidade deve ser maior que 0')
  })).optional().default([])
});

// Criar prontuário médico com transação
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const validatedData = createMedicalRecordSchema.parse(req.body);

    // Verificar se o agendamento existe
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { medicalRecord: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (appointment.medicalRecord) {
      return res.status(400).json({ error: 'Este agendamento já possui um prontuário' });
    }

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o prontuário médico
      const medicalRecord = await tx.medicalRecord.create({
        data: {
          appointmentId: parseInt(appointmentId),
          symptoms: validatedData.symptoms,
          diagnosis: validatedData.diagnosis,
          treatment: validatedData.treatment,
          notes: validatedData.notes
        }
      });

      // 2. Processar produtos utilizados
      if (validatedData.products.length > 0) {
        // Verificar se todos os produtos existem e têm estoque suficiente
        for (const productData of validatedData.products) {
          const product = await tx.product.findUnique({
            where: { id: productData.productId }
          });

          if (!product) {
            throw new Error(`Produto com ID ${productData.productId} não encontrado`);
          }

          if (product.quantity < productData.quantityUsed) {
            throw new Error(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${productData.quantityUsed}`);
          }
        }

        // Criar registros na tabela de junção
        await tx.medicalRecordProduct.createMany({
          data: validatedData.products.map(productData => ({
            medicalRecordId: medicalRecord.id,
            productId: productData.productId,
            quantityUsed: productData.quantityUsed
          }))
        });

        // Decrementar o estoque dos produtos
        for (const productData of validatedData.products) {
          await tx.product.update({
            where: { id: productData.productId },
            data: {
              quantity: {
                decrement: productData.quantityUsed
              }
            }
          });
        }
      }

      // 3. Atualizar status do agendamento para COMPLETED
      await tx.appointment.update({
        where: { id: parseInt(appointmentId) },
        data: { status: 'COMPLETED' }
      });

      return medicalRecord;
    });

    // Buscar o prontuário completo com relacionamentos
    const completeMedicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: result.id },
      include: {
        appointment: {
          include: {
            pet: { include: { tutor: true } }
          }
        },
        products: {
          include: { product: true }
        }
      }
    });

    res.status(201).json(completeMedicalRecord);
  } catch (error) {
    console.error('Erro ao criar prontuário:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' });
  }
};

// Buscar prontuários por pet
export const getRecordsByPet = async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;

    const records = await prisma.medicalRecord.findMany({
      where: {
        appointment: {
          petId: parseInt(petId)
        }
      },
      include: {
        appointment: {
          include: {
            pet: { include: { tutor: true } }
          }
        },
        products: {
          include: { product: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(records);
  } catch (error) {
    console.error('Erro ao buscar prontuários do pet:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar prontuário por agendamento
export const getRecordByAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: {
        appointmentId: parseInt(appointmentId)
      },
      include: {
        appointment: {
          include: {
            pet: { include: { tutor: true } }
          }
        },
        products: {
          include: { product: true }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json(record);
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar todos os produtos disponíveis (para o formulário)
export const getAvailableProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        quantity: {
          gt: 0 // Apenas produtos com estoque
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};