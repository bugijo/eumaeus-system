jest.mock('../tenantContext', () => ({ getCurrentClinicId: () => 1, getCurrentUserId: () => 7 }));
const tx = {
  user: { findFirst: jest.fn(), count: jest.fn(), update: jest.fn() },
  role: { upsert: jest.fn() },
  authProfile: { update: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
};
jest.mock('../lib/prisma', () => ({ prisma: { $transaction: (fn: any) => fn(tx), user: { findFirst: jest.fn() }, authProfile: { update: jest.fn() } } }));

import { UserService, validateStaffPassword } from '../services/user.service';

describe('Gestão de usuários', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exige senha forte para funcionários', () => {
    expect(() => validateStaffPassword('curta1')).toThrow('10 caracteres');
    expect(() => validateStaffPassword('somenteletras')).toThrow('letras e números');
    expect(() => validateStaffPassword('minhasenha123')).toThrow('óbvia');
    expect(() => validateStaffPassword('maria2026xyz', 'maria@clinica.com')).toThrow('e-mail');
    expect(() => validateStaffPassword('Cavalo7Azul9', 'maria@clinica.com')).not.toThrow();
  });

  it('não deixa o próprio usuário se desativar nem se rebaixar', async () => {
    await expect(UserService.update(7, { active: false })).rejects.toThrow('próprio acesso');
    await expect(UserService.update(7, { role: 'RECEPCAO' })).rejects.toThrow('próprio acesso');
  });

  it('mantém ao menos um DONO ativo', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 3, roleName: 'DONO', active: true, authProfileId: 30 });
    tx.user.count.mockResolvedValue(1);
    await expect(UserService.update(3, { active: false })).rejects.toThrow('pelo menos um DONO');
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('ao desativar, derruba a sessão (refresh token)', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 4, roleName: 'RECEPCAO', active: true, authProfileId: 40 });
    tx.user.update.mockResolvedValue({ id: 4, name: 'Ana', roleName: 'RECEPCAO', active: false, authProfile: { email: 'ana@x.com' } });
    const result = await UserService.update(4, { active: false });
    expect(result.active).toBe(false);
    expect(tx.authProfile.update).toHaveBeenCalledWith({ where: { id: 40 }, data: { refreshToken: null } });
  });

  it('recusa e-mail já cadastrado', async () => {
    tx.authProfile.findUnique.mockResolvedValue({ id: 1 });
    await expect(UserService.create({ name: 'Ana', email: 'ANA@x.com', role: 'RECEPCAO', password: 'Cavalo7Azul9' })).rejects.toThrow('Já existe');
    expect(tx.authProfile.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'ana@x.com' } }));
  });
});
