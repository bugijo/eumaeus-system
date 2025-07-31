import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO';

// Estende o tipo Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    type: 'user' | 'tutor';
    role?: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      type: 'user' | 'tutor';
      role?: string;
    };

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
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

export { AuthenticatedRequest };