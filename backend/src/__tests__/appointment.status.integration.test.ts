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

const persistedAppointment = (status: string) => ({
  id: 30,
  petId: 40,
  tutorId: 50,
  appointmentDate: new Date('2026-07-15T14:30:00-03:00'),
  status,
  createdAt: new Date('2026-07-01T12:00:00Z'),
  updatedAt: new Date('2026-07-15T17:30:00Z'),
  pet: { id: 40, name: 'Pet Sintético' },
  tutor: { id: 50, name: 'Tutor Sintético' },
  services: [],
});

describe('appointment status routes', () => {
  beforeEach(() => {
    prisma.appointment.update.mockReset();
  });

  it('preserves an uppercase canonical status', async () => {
    prisma.appointment.update.mockResolvedValue(persistedAppointment('CONFIRMED'));

    const response = await request(app)
      .patch('/api/appointments/30/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CONFIRMED');
    expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'CONFIRMED' },
    }));
  });

  it('normalizes a Portuguese status in the general update route', async () => {
    prisma.appointment.update.mockResolvedValue(persistedAppointment('COMPLETED'));

    const response = await request(app)
      .put('/api/appointments/30')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'Concluído' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('COMPLETED');
    expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'COMPLETED' },
    }));
  });

  it('returns 400 for an invalid status without writing a fallback', async () => {
    const response = await request(app)
      .patch('/api/appointments/30/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'WAITING' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Status de agendamento inválido');
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });
});
