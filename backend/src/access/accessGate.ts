import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { DEFAULT_PLAN, PermissionKey, PlanKey, normalizePlan, requiredPermissions, resolvePermissions } from './permissions';

type TokenUser = { id: number; type: 'user' | 'tutor'; role?: string; clinicId?: number };

export type ClinicAccess = { plan: PlanKey; separateUnits: boolean };

// Plano muda raramente; 30 s de cache evitam uma consulta a mais por requisição.
const PLAN_TTL_MS = 30_000;
const planCache = new Map<number, { value: ClinicAccess; at: number }>();

export const invalidateClinicAccess = (clinicId?: number) => {
  if (clinicId === undefined) planCache.clear();
  else planCache.delete(clinicId);
};

export async function loadClinicAccess(clinicId: number): Promise<ClinicAccess> {
  const cached = planCache.get(clinicId);
  if (cached && Date.now() - cached.at < PLAN_TTL_MS) return cached.value;
  const settings = await runWithClinic(clinicId, () => (prisma.clinicSettings as any).findFirst({
    where: { clinicId },
    select: { plan: true, separateUnits: true },
  }));
  const value: ClinicAccess = {
    plan: normalizePlan(settings?.plan ?? DEFAULT_PLAN),
    separateUnits: settings?.separateUnits !== false,
  };
  planCache.set(clinicId, { value, at: Date.now() });
  return value;
}

export async function loadUserAccess(userId: number, clinicId: number) {
  const [clinic, user] = await Promise.all([
    loadClinicAccess(clinicId),
    runWithClinic(clinicId, () => (prisma.user as any).findFirst({
      where: { id: userId, clinicId },
      select: { roleName: true, permissions: true, active: true },
    })),
  ]);
  if (!user || user.active === false) return null;
  const custom = Array.isArray(user.permissions) ? user.permissions : null;
  return {
    ...clinic,
    role: String(user.roleName || '').toUpperCase(),
    customized: custom !== null,
    permissions: resolvePermissions({ role: user.roleName, custom, plan: clinic.plan }),
  };
}

function readToken(req: Request): TokenUser | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token, ...extra] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length) return null;
  try {
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') return null;
    return decoded as TokenUser;
  } catch {
    return null;
  }
}

/**
 * Porteiro de módulos, montado em /api antes das rotas.
 * Sem token válido ou sem regra para o caminho, segue adiante e a rota decide (401 ou checagem de cargo).
 * Com regra: libera só se o plano e as permissões do funcionário incluírem uma das chaves exigidas.
 */
export async function accessGate(req: Request, res: Response, next: NextFunction) {
  const required = requiredPermissions(req.method, req.path);
  if (!required) return next();
  const user = readToken(req);
  if (!user || user.type !== 'user' || !Number.isInteger(user.id) || !Number.isInteger(user.clinicId)) return next();
  try {
    const access = await loadUserAccess(user.id, user.clinicId!);
    if (!access) return res.status(401).json({ message: 'Acesso revogado' });
    const allowed = required.some((key: PermissionKey) => access.permissions.includes(key));
    if (!allowed) {
      return res.status(403).json({ message: 'Seu acesso não inclui este módulo', required });
    }
    (req as any).accessGranted = true;
    return next();
  } catch (error) {
    return next(error);
  }
}
