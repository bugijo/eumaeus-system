import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { runWithClinic, runWithUser } from '../tenantContext';
import { prisma } from '../lib/prisma';

export const ROLE = {
  DONO: 'DONO',
  VETERINARIO: 'VETERINARIO',
  RECEPCAO: 'RECEPCAO',
  AUXILIAR: 'AUXILIAR',
  FINANCEIRO: 'FINANCEIRO',
  FUNCIONARIO: 'FUNCIONARIO',
} as const;

export type AppRole = (typeof ROLE)[keyof typeof ROLE];

// Estende o tipo Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    type: 'user' | 'tutor';
    role?: string;
    clinicId?: number;
  };
}

type AccessTokenPayload = JwtPayload & NonNullable<AuthenticatedRequest['user']>;

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload => (
  typeof payload !== 'string' &&
  Number.isInteger(payload.id) &&
  payload.id > 0 &&
  (payload.type === 'user' || payload.type === 'tutor') &&
  (payload.role === undefined || typeof payload.role === 'string') &&
  (payload.clinicId === undefined || (Number.isInteger(payload.clinicId) && payload.clinicId > 0))
);

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    });

    if (!isAccessTokenPayload(decoded)) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

const accountIsActive = async (user: NonNullable<AuthenticatedRequest['user']>): Promise<boolean> => {
  if (user.type === 'user') {
    const findFirst = (prisma.user as any).findFirst;
    if (typeof findFirst !== 'function') return true;
    const record = await findFirst({ where: { id: user.id } });
    return Boolean(record) && record.active !== false;
  }
  const findFirst = (prisma.tutor as any).findFirst;
  if (typeof findFirst !== 'function') return true;
  const record = await findFirst({ where: { id: user.id, deletedAt: null } });
  return Boolean(record);
};

// Middleware específico para tutores
export const authenticateTutor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return authenticateToken(req, res, () => {
    if (req.user?.type !== 'tutor' || !req.user.clinicId) {
      return res.status(403).json({ message: 'Acesso restrito a tutores' });
    }
    return runWithClinic(req.user.clinicId, () => runWithUser(req.user!.id, async () => {
      try {
        if (!(await accountIsActive(req.user!))) return res.status(401).json({ message: 'Acesso revogado' });
        return next();
      } catch { return res.status(401).json({ message: 'Acesso revogado' }); }
    }));
  });
};

// Middleware específico para funcionários
export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return authenticateToken(req, res, () => {
    if (req.user?.type !== 'user') {
      return res.status(403).json({ message: 'Acesso restrito a funcionários' });
    }
    return next();
  });
};

// RBAC para rotas de funcionários
export const requireRoles = (...allowedRoles: AppRole[]) => {
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());
  const roleAlias: Record<string, string> = {
    FUNCIONARIO: ROLE.RECEPCAO,
  };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    return authenticateToken(req, res, () => {
      if (!req.user || req.user.type !== 'user') {
        return res.status(403).json({ message: 'Acesso restrito a funcionários' });
      }

      if (!req.user.clinicId) {
        return res.status(403).json({ message: 'Contexto da clínica ausente' });
      }

      const rawUserRole = (req.user.role || '').toUpperCase();
      const normalizedUserRole = roleAlias[rawUserRole] || rawUserRole;
      if (!normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole)) {
        return res.status(403).json({ message: 'Permissão insuficiente para esta operação' });
      }

      return runWithClinic(req.user.clinicId, () => runWithUser(req.user!.id, async () => {
        try {
          if (!(await accountIsActive(req.user!))) return res.status(401).json({ message: 'Acesso revogado' });
          return next();
        } catch { return res.status(401).json({ message: 'Acesso revogado' }); }
      }));
    });
  };
};

export { AuthenticatedRequest };
