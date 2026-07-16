import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { app } from '../server';

const prisma = new PrismaClient() as any;

const accessToken = jwt.sign(
  { id: 20, type: 'user', role: 'DONO' },
  process.env.JWT_SECRET as string,
  { algorithm: 'HS256', expiresIn: '1h' },
);

const auth = (requestBuilder: request.Test) => requestBuilder
  .set('Authorization', `Bearer ${accessToken}`);

describe('mounted medical record routes', () => {
  beforeEach(() => {
    prisma.$transaction.mockReset();
    prisma.medicalRecord.findMany.mockReset();
    prisma.medicalRecord.findUnique.mockReset();
    prisma.medicalRecord.create.mockReset();
    prisma.appointment.findUnique.mockReset();
    prisma.appointment.create.mockReset();
    prisma.appointment.update.mockReset();
    prisma.pet.findUnique.mockReset();
    prisma.product.findMany.mockReset();
  });

  it('lists records through the URL used by the pet history page', async () => {
    prisma.medicalRecord.findMany.mockResolvedValue([{ id: 1, diagnosis: 'Sintético' }]);

    const response = await auth(request(app).get('/api/records/pets/40/records'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, diagnosis: 'Sintético' }]);
    expect(prisma.medicalRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { appointment: { petId: 40 } },
    }));
  });

  it('lists available products through the URL used by the record form', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 2, name: 'Produto Sintético', quantity: 5 }]);

    const response = await auth(request(app).get('/api/records/products'));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { quantity: { gt: 0 } },
      orderBy: { name: 'asc' },
    });
  });

  it('creates a record for an existing appointment through the legacy form URL', async () => {
    prisma.appointment.findUnique.mockResolvedValue({ id: 30, medicalRecord: null });
    prisma.medicalRecord.create.mockResolvedValue({ id: 60 });
    prisma.medicalRecord.findUnique.mockResolvedValue({ id: 60, diagnosis: 'Sintético' });
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => callback(prisma));

    const response = await auth(request(app)
      .post('/api/records/30')
      .send({
        symptoms: 'Sintoma sintético',
        diagnosis: 'Diagnóstico sintético',
        treatment: 'Tratamento sintético',
      }));

    expect(response.status).toBe(201);
    expect(prisma.medicalRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ appointmentId: 30 }),
    }));
  });

  it('creates a direct record through the URL used by the standalone form', async () => {
    prisma.pet.findUnique.mockResolvedValue({ id: 40, tutorId: 50, tutor: { id: 50 } });
    prisma.appointment.create.mockResolvedValue({ id: 31 });
    prisma.medicalRecord.create.mockResolvedValue({ id: 61 });
    prisma.medicalRecord.findUnique.mockResolvedValue({ id: 61, diagnosis: 'Sintético' });
    prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => callback(prisma));

    const response = await auth(request(app)
      .post('/api/records/direct')
      .send({
        petId: 40,
        symptoms: 'Sintoma sintético',
        diagnosis: 'Diagnóstico sintético',
        treatment: 'Tratamento sintético',
      }));

    expect(response.status).toBe(201);
    expect(prisma.appointment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ petId: 40, tutorId: 50 }),
    }));
  });
});
