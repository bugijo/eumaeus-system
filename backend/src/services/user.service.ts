import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

export const STAFF_ROLES = ['DONO', 'VETERINARIO', 'RECEPCAO', 'AUXILIAR', 'FINANCEIRO'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  DONO: 'Acesso total ao sistema.',
  VETERINARIO: 'Atendimento, prontuário, receitas e estoque clínico.',
  RECEPCAO: 'Agenda, cadastros, caixa e recepção.',
  AUXILIAR: 'Apoio clínico, estoque e caixa.',
  FINANCEIRO: 'Financeiro, caixa e relatórios contábeis.',
};

export class UserServiceError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

/** Política para senhas de funcionários: 10+ caracteres, letras e números, sem padrões triviais. */
export function validateStaffPassword(password: string, email = '') {
  const value = String(password || '');
  const bytes = Buffer.byteLength(value, 'utf8');
  if (bytes < 10) throw new UserServiceError('A senha precisa ter pelo menos 10 caracteres');
  if (bytes > 72) throw new UserServiceError('A senha pode ter no máximo 72 caracteres');
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) throw new UserServiceError('A senha precisa ter letras e números');
  if (/(?:password|senha|eumaeus|qwerty|123456|abcdef)/i.test(value)) throw new UserServiceError('Senha muito óbvia; escolha outra');
  const identity = email.split('@', 1)[0]?.toLowerCase() || '';
  if (identity.length >= 3 && value.toLowerCase().includes(identity)) throw new UserServiceError('A senha não pode conter o e-mail');
}

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const parseRole = (role: unknown): StaffRole => {
  const value = String(role || '').toUpperCase() as StaffRole;
  if (!STAFF_ROLES.includes(value)) throw new UserServiceError('Cargo inválido');
  return value;
};

const publicUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.authProfile?.email ?? null,
  role: user.roleName,
  active: user.active !== false,
  createdAt: user.createdAt,
});

export class UserService {
  static roles() {
    return STAFF_ROLES.map((name) => ({ name, description: ROLE_DESCRIPTIONS[name] }));
  }

  static async list() {
    const users = await (prisma.user as any).findMany({ include: { authProfile: { select: { email: true } } }, orderBy: [{ active: 'desc' }, { name: 'asc' }] });
    return users.map(publicUser);
  }

  static async create(input: { name: string; email: string; role: string; password: string }) {
    const clinicId = getCurrentClinicId();
    if (!clinicId) throw new UserServiceError('Contexto da clínica ausente', 403);
    const name = String(input.name || '').trim();
    const email = normalizeEmail(input.email);
    const role = parseRole(input.role);
    if (name.length < 2) throw new UserServiceError('Informe o nome do funcionário');
    if (!isEmail(email)) throw new UserServiceError('E-mail inválido');
    validateStaffPassword(input.password, email);
    const passwordHash = await bcrypt.hash(input.password, 12);

    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.authProfile.findUnique({ where: { email }, select: { id: true } });
      if (existing) throw new UserServiceError('Já existe um acesso com este e-mail', 409);
      await tx.role.upsert({ where: { name: role }, update: {}, create: { name: role, description: ROLE_DESCRIPTIONS[role] } });
      const authProfile = await tx.authProfile.create({ data: { email, password: passwordHash }, select: { id: true } });
      const user = await tx.user.create({ data: { name, roleName: role, clinicId, authProfileId: authProfile.id }, include: { authProfile: { select: { email: true } } } });
      return publicUser(user);
    });
  }

  /** Garante que a clínica nunca fique sem um DONO ativo. */
  private static async assertKeepsAnOwner(tx: any, userId: number, next: { role?: StaffRole; active?: boolean }) {
    const target = await tx.user.findFirst({ where: { id: userId } });
    if (!target) throw new UserServiceError('Usuário não encontrado', 404);
    const losesOwner = target.roleName === 'DONO' && target.active !== false && ((next.role && next.role !== 'DONO') || next.active === false);
    if (losesOwner) {
      const owners = await tx.user.count({ where: { roleName: 'DONO', active: true } });
      if (owners <= 1) throw new UserServiceError('A clínica precisa de pelo menos um DONO ativo', 409);
    }
    return target;
  }

  static async update(userId: number, input: { name?: string; role?: string; active?: boolean }) {
    const actorId = getCurrentUserId();
    const next: { name?: string; role?: StaffRole; active?: boolean } = {};
    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (name.length < 2) throw new UserServiceError('Informe o nome do funcionário');
      next.name = name;
    }
    if (input.role !== undefined) next.role = parseRole(input.role);
    if (input.active !== undefined) next.active = Boolean(input.active);
    if (actorId === userId && (next.active === false || (next.role && next.role !== 'DONO'))) {
      throw new UserServiceError('Você não pode desativar nem rebaixar o próprio acesso', 409);
    }

    return prisma.$transaction(async (tx: any) => {
      const target = await UserService.assertKeepsAnOwner(tx, userId, next);
      if (next.role) await tx.role.upsert({ where: { name: next.role }, update: {}, create: { name: next.role, description: ROLE_DESCRIPTIONS[next.role] } });
      const user = await tx.user.update({
        where: { id: userId },
        data: { ...(next.name ? { name: next.name } : {}), ...(next.role ? { roleName: next.role } : {}), ...(next.active !== undefined ? { active: next.active } : {}) },
        include: { authProfile: { select: { email: true } } },
      });
      if (next.active === false || (next.role && next.role !== target.roleName)) {
        await tx.authProfile.update({ where: { id: target.authProfileId }, data: { refreshToken: null } });
      }
      return publicUser(user);
    });
  }

  static async resetPassword(userId: number, password: string) {
    const user = await (prisma.user as any).findFirst({ where: { id: userId }, include: { authProfile: { select: { id: true, email: true } } } });
    if (!user) throw new UserServiceError('Usuário não encontrado', 404);
    validateStaffPassword(password, user.authProfile?.email || '');
    const hash = await bcrypt.hash(password, 12);
    await prisma.authProfile.update({ where: { id: user.authProfileId }, data: { password: hash, refreshToken: null } });
    return { ok: true };
  }

  static async changeOwnPassword(currentPassword: string, newPassword: string) {
    const actorId = getCurrentUserId();
    if (!actorId) throw new UserServiceError('Sessão inválida', 401);
    const user = await (prisma.user as any).findFirst({ where: { id: actorId }, include: { authProfile: true } });
    if (!user?.authProfile) throw new UserServiceError('Usuário não encontrado', 404);
    const ok = await bcrypt.compare(String(currentPassword || ''), user.authProfile.password);
    if (!ok) throw new UserServiceError('Senha atual incorreta', 403);
    if (currentPassword === newPassword) throw new UserServiceError('A nova senha precisa ser diferente da atual');
    validateStaffPassword(newPassword, user.authProfile.email);
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.authProfile.update({ where: { id: user.authProfileId }, data: { password: hash, refreshToken: null } });
    return { ok: true };
  }
}
