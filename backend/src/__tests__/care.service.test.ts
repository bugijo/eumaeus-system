import { runWithClinic, runWithUser } from '../tenantContext';

const prismaMock = {
  pet: { findFirst: jest.fn() },
  appointment: { findFirst: jest.fn() },
  user: { findFirst: jest.fn() },
  hospitalizationAdmission: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  hospitalizationTask: { create: jest.fn(), update: jest.fn() },
  hospitalizationPrescription: { create: jest.fn() },
  hospitalizationHandoff: { create: jest.fn() },
  surgeryCase: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  surgeryBudgetVersion: { findFirst: jest.fn(), create: jest.fn() },
  surgeryConsent: { create: jest.fn() },
  surgeryChecklistItem: { create: jest.fn(), update: jest.fn() },
  surgeryInstruction: { create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock('../lib/prisma', () => ({ prisma: prismaMock }));
import { CareService } from '../services/care.service';

describe('care records', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires authenticated clinic context and active responsible user for admission', async () => {
    prismaMock.pet.findFirst.mockResolvedValue({ id: 4 });
    prismaMock.user.findFirst.mockResolvedValue({ id: 3, active: true });
    prismaMock.hospitalizationAdmission.create.mockResolvedValue({ id: 1 });

    await expect(CareService.admit({ petId: 4, responsibleUserId: 3 })).rejects.toThrow('Contexto da clínica ausente');
    await expect(runWithClinic(7, () => CareService.admit({ petId: 4, responsibleUserId: 3 }))).resolves.toEqual({ id: 1 });
    expect(prismaMock.hospitalizationAdmission.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ clinicId: 7, petId: 4, responsibleUserId: 3 }) }));
  });

  it('creates immutable surgery budget versions without inventing clinical content', async () => {
    prismaMock.surgeryCase.findFirst.mockResolvedValue({ id: 9 });
    prismaMock.surgeryBudgetVersion.findFirst.mockResolvedValue({ version: 2 });
    prismaMock.surgeryBudgetVersion.create.mockResolvedValue({ id: 8, version: 3, amount: '125.50' });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock));

    await expect(runWithClinic(7, () => runWithUser(3, () => CareService.addBudget(9, { description: 'Valor informado pela veterinária', amount: '125.50' })))).resolves.toEqual({ id: 8, version: 3, amount: '125.50' });
    expect(prismaMock.surgeryBudgetVersion.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ clinicId: 7, surgeryId: 9, version: 3, amount: '125.50', createdById: 3 }) }));
  });

  it('derives prescription authorship from authenticated context, ignoring client fields', async () => {
    prismaMock.hospitalizationAdmission.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.hospitalizationPrescription.create.mockResolvedValue({ id: 12, createdById: 3 });
    await expect(runWithClinic(7, () => runWithUser(3, () => CareService.addPrescription(1, { medication: 'SINTETICO', instructions: 'Somente teste local' })))).resolves.toEqual({ id: 12, createdById: 3 });
    expect(prismaMock.hospitalizationPrescription.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ createdById: 3 }) }));
  });

  it('rejects scalar foreign keys from another clinic before creating care records', async () => {
    prismaMock.hospitalizationAdmission.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(7, () => CareService.addTask(99, { title: 'Tarefa sintética' }))).rejects.toThrow('Internação não pertence à clínica autenticada');
    expect(prismaMock.hospitalizationTask.create).not.toHaveBeenCalled();

    prismaMock.surgeryCase.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(7, () => CareService.addChecklist(99, { label: 'Checklist sintético' }))).rejects.toThrow('Cirurgia não pertence à clínica autenticada');
    expect(prismaMock.surgeryChecklistItem.create).not.toHaveBeenCalled();
  });

  it('rejects a budget version linked to a different surgery', async () => {
    prismaMock.surgeryCase.findFirst.mockResolvedValue({ id: 9 });
    prismaMock.surgeryBudgetVersion.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(7, () => CareService.addConsent(9, { budgetVersionId: 77, recordedById: 3 }))).rejects.toThrow('Versão de orçamento não pertence à cirurgia autenticada');
    expect(prismaMock.surgeryConsent.create).not.toHaveBeenCalled();
  });

  it.each([
    ['task', () => CareService.addTask(1, { title: '' })],
    ['prescription', () => CareService.addPrescription(1, { medication: '', instructions: '' })],
    ['handoff', () => CareService.handoff(1, { fromUserId: 3, toUserId: 4, notes: '' })],
    ['discharge', () => CareService.discharge(1, { notes: '', reviewerId: 3 })],
  ] as Array<[string, () => Promise<unknown>]> )('rejects incomplete %s records before persistence', async (_name, operation) => {
    await expect(runWithClinic(7, operation)).rejects.toThrow();
    expect(prismaMock.hospitalizationTask.create).not.toHaveBeenCalled();
    expect(prismaMock.hospitalizationPrescription.create).not.toHaveBeenCalled();
    expect(prismaMock.hospitalizationHandoff?.create).not.toHaveBeenCalled();
  });
});
