import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

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
  };
}

type AccessTokenPayload = JwtPayload & NonNullable<AuthenticatedRequest['user']>;

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload => (
  typeof payload !== 'string' &&
  Number.isInteger(payload.id) &&
  payload.id > 0 &&
  (payload.type === 'user' || payload.type === 'tutor') &&
  (payload.role === undefined || typeof payload.role === 'string')
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

// Middleware específico para tutores
export const authenticateTutor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  return authenticateToken(req, res, () => {
    if (req.user?.type !== 'tutor') {
      return res.status(403).json({ message: 'Acesso restrito a tutores' });
    }
    return next();
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

      const rawUserRole = (req.user.role || '').toUpperCase();
      const normalizedUserRole = roleAlias[rawUserRole] || rawUserRole;
      if (!normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole)) {
        return res.status(403).json({ message: 'Permissão insuficiente para esta operação' });
      }

      return next();
    });
  };
};

export { AuthenticatedRequest };
