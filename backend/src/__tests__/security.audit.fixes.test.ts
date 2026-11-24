import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { runWithClinic, runWithUser } from '../tenantContext';
import { requiredPermissions } from '../access/permissions';
import { AuthenticatedRequest, requireRoles, requireRolesStrict, ROLE } from '../middlewares/auth.middleware';
import { VaccinationService } from '../services/vaccination.service';
import { SaleService } from '../services/sale.service';
import { clearDashboardStatsCache, dashboardController } from '../controllers/dashboardController';

const db = prisma as any;

const createResponse = () => {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
};

const token = (role: string) => `Bearer ${jwt.sign({ id: 7, type: 'user', role, clinicId: 1 }, process.env.JWT_SECRET as string, { algorithm: 'HS256' })}`;

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('Auditoria: porteiro normaliza a caixa do caminho', () => {
  it('aplica a mesma regra a /tutors, /TUTORS e /Tutors', () => {
    const lower = requiredPermissions('GET', '/tutors');
    expect(lower).not.toBeNull();
    expect(requiredPermissions('GET', '/TUTORS')).toEqual(lower);
    expect(requiredPermissions('GET', '/Tutors/1/communication-preferences')).toEqual(requiredPermissions('GET', '/tutors/1/communication-preferences'));
    expect(requiredPermissions('POST', '/SALES/1/CANCEL')).toEqual(['caixa_cancelar']);
    expect(requiredPermissions('POST', '/CASH/close')).toEqual(requiredPermissions('POST', '/cash/close'));
  });
});

describe('Auditoria: cargo estrito não é aberto pelo porteiro de módulos', () => {
  beforeEach(() => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ active: true, roleName: ROLE.AUXILIAR });
  });

  const run = async (guard: ReturnType<typeof requireRoles>) => {
    const req = { headers: { authorization: token(ROLE.AUXILIAR) }, accessGranted: true } as unknown as AuthenticatedRequest;
    const res = createResponse();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    guard(req, res, next);
    await flush();
    return { res, next };
  };

  it('requireRoles segue a concessão do porteiro (escolha do dono)', async () => {
    const { next, res } = await run(requireRoles(ROLE.DONO, ROLE.VETERINARIO));
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('requireRolesStrict recusa AUXILIAR mesmo com concessão do porteiro', async () => {
    const { next, res } = await run(requireRolesStrict(ROLE.DONO, ROLE.VETERINARIO));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requireRolesStrict libera o cargo da lista', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ active: true, roleName: ROLE.VETERINARIO });
    const req = { headers: { authorization: token(ROLE.VETERINARIO) } } as unknown as AuthenticatedRequest;
    const res = createResponse();
    const next = jest.fn();
    requireRolesStrict(ROLE.DONO, ROLE.VETERINARIO)(req, res, next);
    await flush();
    expect(next).toHaveBeenCalled();
  });
});

describe('Auditoria: vacina só aceita prontuário do mesmo pet e clínica', () => {
  beforeEach(() => {
    (prisma.pet.findFirst as jest.Mock).mockResolvedValue({ id: 3, tutorId: 9, tutor: { id: 9 } });
    db.vaccinationRecord.create.mockResolvedValue({ id: 1, vaccineName: 'V10', nextDueAt: null });
  });

  const create = (medicalRecordId?: number) => runWithClinic(1, () => VaccinationService.create({ petId: 3, medicalRecordId, responsibleUserId: 7, vaccineName: 'V10' }));

  it('recusa prontuário que não é do pet na clínica (outro estabelecimento)', async () => {
    (prisma.medicalRecord.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(create(999)).rejects.toThrow('Prontuário não pertence');
    expect(db.vaccinationRecord.create).not.toHaveBeenCalled();
    expect((prisma.medicalRecord.findFirst as jest.Mock).mock.calls[0][0].where).toEqual({ id: 999, appointment: { petId: 3 } });
  });

  it('aceita prontuário do próprio pet e vacina sem prontuário', async () => {
    (prisma.medicalRecord.findFirst as jest.Mock).mockResolvedValue({ id: 5 });
    await expect(create(5)).resolves.toMatchObject({ id: 1 });
    await expect(create()).resolves.toMatchObject({ id: 1 });
  });
});

describe('Auditoria: venda só aceita tutor e centro do estabelecimento', () => {
  const originals: Record<string, unknown> = {};
  beforeAll(() => {
    for (const model of ['sale', 'cashSession', 'product']) originals[model] = db[model];
    db.sale = { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 1, number: 1 }) };
    db.cashSession = { findFirst: jest.fn().mockResolvedValue({ id: 4 }) };
    db.product = { ...(originals.product as object), findMany: jest.fn().mockResolvedValue([{ id: 2, name: 'Ração', quantity: 10, price: 10, salePrice: 10, resultCenterId: null }]), updateMany: jest.fn().mockResolvedValue({ count: 1 }) };
    db.productLot = { ...(db.productLot || {}), findMany: jest.fn().mockResolvedValue([]) };
  });
  afterAll(() => { for (const [model, value] of Object.entries(originals)) db[model] = value; });

  const sell = (extra: Record<string, number>) => runWithClinic(1, () => runWithUser(7, () => SaleService.create({
    items: [{ productId: 2, quantity: 1 }], payments: [{ method: 'PIX', amount: 10 }], idempotencyKey: `k-${Math.random()}`, ...extra,
  })));

  it('recusa centro de resultado de outro estabelecimento', async () => {
    db.resultCenter.findFirst.mockResolvedValue(null);
    await expect(sell({ resultCenterId: 50 })).rejects.toThrow('Centro de resultado não encontrado');
    expect(db.sale.create).not.toHaveBeenCalled();
  });

  it('recusa tutor de outro estabelecimento', async () => {
    db.tutor.findFirst = jest.fn().mockResolvedValue(null);
    await expect(sell({ tutorId: 80 })).rejects.toThrow('Tutor não encontrado');
    expect(db.sale.create).not.toHaveBeenCalled();
  });

  it('aceita tutor e centro encontrados no estabelecimento', async () => {
    db.resultCenter.findFirst.mockResolvedValue({ id: 50 });
    db.tutor.findFirst = jest.fn().mockResolvedValue({ id: 80 });
    await expect(sell({ resultCenterId: 50, tutorId: 80 })).resolves.toMatchObject({ id: 1 });
    expect(db.sale.create.mock.calls[0][0].data).toMatchObject({ resultCenterId: 50, tutorId: 80 });
  });
});

describe('Auditoria: cache do dashboard separado por estabelecimento', () => {
  beforeEach(() => {
    clearDashboardStatsCache();
    db.sale = { aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 } }) };
    db.invoice = { ...(db.invoice || {}), aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }) };
    db.product = { ...(db.product || {}), count: jest.fn().mockResolvedValue(0) };
    (prisma.pet.count as jest.Mock).mockResolvedValue(0);
    (prisma.appointment.count as jest.Mock).mockResolvedValue(0);
  });

  it('não devolve as estatísticas de um estabelecimento para outro', async () => {
    (prisma.tutor.count as jest.Mock).mockResolvedValueOnce(11).mockResolvedValueOnce(3);
    const resA = createResponse();
    await runWithClinic(1, () => dashboardController.getStats({} as Request, resA));
    const resB = createResponse();
    await runWithClinic(2, () => dashboardController.getStats({} as Request, resB));
    expect(resA.json.mock.calls[0][0].tutorCount).toBe(11);
    expect(resB.json.mock.calls[0][0].tutorCount).toBe(3);

    const resA2 = createResponse();
    await runWithClinic(1, () => dashboardController.getStats({} as Request, resA2));
    expect(resA2.json.mock.calls[0][0].tutorCount).toBe(11);
    expect(prisma.tutor.count).toHaveBeenCalledTimes(2);
  });
});
