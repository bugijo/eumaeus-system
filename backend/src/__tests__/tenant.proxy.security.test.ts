import { createTenantModelProxy } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';

describe('tenant Prisma proxy', () => {
  const calls: Record<string, unknown[]> = {};
  const delegate = {
    update: async (input: unknown) => { calls.update = [input]; return input; },
    create: async (input: unknown) => { calls.create = [input]; return input; },
  };
  const model = () => createTenantModelProxy('user', delegate, undefined);

  beforeEach(() => {
    Object.keys(calls).forEach(key => delete calls[key]);
  });

  it('derives clinicId on updates from the authenticated context', async () => {
    await runWithClinic(7, () => model().update({
      where: { id: 1 },
      data: { name: 'Synthetic' },
    }));

    expect(calls.update[0]).toEqual({
      where: { id: 1, clinicId: 7 },
      data: { name: 'Synthetic', clinicId: 7 },
    });
  });

  it('rejects explicit nested relation writes that could bypass tenant validation', async () => {
    await expect(runWithClinic(7, () => (createTenantModelProxy('pet', delegate, undefined) as any).create({
      data: { name: 'Synthetic', tutor: { connect: { id: 99 } } },
    }))).rejects.toThrow(/Associação relacional/);
  });

  it('rejects a nested clinicId from another tenant', async () => {
    await expect(runWithClinic(7, () => model().update({
      where: { id: 1 },
      data: { clinicId: 8 },
    }))).rejects.toThrow(/clinicId/);
  });
});
