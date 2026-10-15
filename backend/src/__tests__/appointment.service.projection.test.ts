import { AppointmentService } from '../services/appointment.service';
import { prisma } from '../lib/prisma';

describe('AppointmentService response projection', () => {
  it('includes the persisted catalog service name', async () => {
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([{
      id: 30,
      petId: 40,
      tutorId: 50,
      appointmentDate: new Date('2026-10-14T13:00:00Z'),
      status: 'SCHEDULED',
      createdAt: new Date('2026-10-13T00:00:00Z'),
      updatedAt: new Date('2026-10-13T00:00:00Z'),
      pet: { id: 40, name: 'Pet Sintético' },
      tutor: { id: 50, name: 'Tutor Sintético' },
      services: [{ id: 41, name: 'Banho QA Jornada', price: 45.9, catalogServiceId: 24 }],
    }]);

    const appointments = await AppointmentService.getAllAppointments();

    expect(appointments).toEqual([expect.objectContaining({
      id: 30,
      serviceType: 'Banho QA Jornada',
      status: 'SCHEDULED',
      services: [{ id: 41, name: 'Banho QA Jornada', price: 45.9, catalogServiceId: 24 }],
    })]);
  });
});
