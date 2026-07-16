// Em /src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const isRefreshTokenPayload = (
  payload: string | JwtPayload,
): payload is JwtPayload & { authProfileId: number } => (
  typeof payload !== 'string' &&
  Number.isInteger(payload.authProfileId) &&
  payload.authProfileId > 0
);

export const shouldRejectProductionPassword = (
  password: unknown,
  environment = config.app.env,
): boolean => (
  environment.trim().toLowerCase() === 'production' &&
  (typeof password !== 'string' || password.length < 12)
);

export default {
  async login(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        shouldRejectProductionPassword(password)
      ) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // PASSO 1: Buscar o AuthProfile e TUDO que precisamos de uma só vez com 'include'.
      // Esta é a forma mais segura de garantir que o TypeScript entenda os dados.
      const authProfile = await prisma.authProfile.findUnique({
        where: { email },
        include: {
          user: {
            include: {
              role: true,
            },
          },
          tutor: true,
        },
      });

      if (!authProfile) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(password, authProfile.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // O resto da nossa lógica condicional, agora com 100% de certeza dos tipos.
      let tokenPayload;
      let userPayload;

      if (authProfile.user) {
        const userRole = authProfile.user.role?.name || 'FUNCIONARIO';
        tokenPayload = { id: authProfile.user.id, type: 'user', role: userRole };
        userPayload = { id: authProfile.user.id, name: authProfile.user.name, email: authProfile.email, role: userRole, type: 'user' };
      } else if (authProfile.tutor) {
        tokenPayload = { id: authProfile.tutor.id, type: 'tutor', role: 'ADMIN' };
        userPayload = { id: authProfile.tutor.id, name: authProfile.tutor.name, email: authProfile.email, role: 'ADMIN', type: 'tutor' };
      } else {
        return res.status(403).json({ message: 'Acesso negado. Perfil não associado a uma conta ativa.' });
      }

      const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        algorithm: 'HS256',
        expiresIn: config.jwt.accessExpiresIn,
      });
      const refreshToken = jwt.sign({ authProfileId: authProfile.id }, config.jwt.refreshSecret, {
        algorithm: 'HS256',
        expiresIn: config.jwt.refreshExpiresIn,
      });

      await prisma.authProfile.update({
        where: { id: authProfile.id },
        data: { refreshToken },
      });

      return res.status(200).json({ accessToken, refreshToken, user: userPayload });

    } catch {
      console.error('Erro no login.');
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async refresh(req: Request, res: Response): Promise<Response | void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token não fornecido' });
      }

      // 1. Verificar se o refresh token é válido
      let decoded: JwtPayload & { authProfileId: number };
      try {
        const verifiedPayload = jwt.verify(refreshToken, config.jwt.refreshSecret, {
          algorithms: ['HS256'],
        });

        if (!isRefreshTokenPayload(verifiedPayload)) {
          return res.status(401).json({ message: 'Refresh token inválido' });
        }

        decoded = verifiedPayload;
      } catch {
        return res.status(401).json({ message: 'Refresh token inválido' });
      }

      // 2. Verificar se o refresh token existe no banco e buscar o perfil associado
      const authProfile = await prisma.authProfile.findFirst({
        where: {
          id: decoded.authProfileId,
          refreshToken: refreshToken,
        },
        include: {
          user: { include: { role: true } },
        },
      });

      if (!authProfile) {
        return res.status(401).json({ message: 'Refresh token não encontrado' });
      }

      // 3. Verifica se é um funcionário da clínica
      if (!authProfile.user) {
        return res.status(403).json({ message: 'Acesso negado. Apenas funcionários podem fazer login.' });
      }

      // 4. Gerar payload para funcionário
      const tokenPayload = { id: authProfile.user.id, type: 'user', role: authProfile.user.role.name };
      const userPayload = { id: authProfile.user.id, name: authProfile.user.name, email: authProfile.email, role: authProfile.user.role.name, type: 'user' };

      // 5. Gerar novos tokens
      const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        algorithm: 'HS256',
        expiresIn: config.jwt.accessExpiresIn,
      });
      const newRefreshToken = jwt.sign({ authProfileId: authProfile.id }, config.jwt.refreshSecret, {
        algorithm: 'HS256',
        expiresIn: config.jwt.refreshExpiresIn,
      });

      // 6. Atualizar o refresh token no banco
      await prisma.authProfile.update({
        where: { id: authProfile.id },
        data: { refreshToken: newRefreshToken },
      });

      // 7. Enviar os novos tokens
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userPayload,
      });
    } catch {
      console.error('Erro no refresh.');
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async logout(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== 'string' || refreshToken.length === 0 || !req.user) {
      return res.status(204).send();
    }

    let decoded: JwtPayload & { authProfileId: number };
    try {
      const verifiedPayload = jwt.verify(refreshToken, config.jwt.refreshSecret, {
        algorithms: ['HS256'],
      });

      if (!isRefreshTokenPayload(verifiedPayload)) {
        return res.status(204).send();
      }

      decoded = verifiedPayload;
    } catch {
      return res.status(204).send();
    }

    try {
      const authProfile = await prisma.authProfile.findFirst({
        where: {
          id: decoded.authProfileId,
          refreshToken,
        },
        include: {
          user: true,
          tutor: true,
        },
      });

      const belongsToAuthenticatedAccount =
        (req.user.type === 'user' && authProfile?.user?.id === req.user.id) ||
        (req.user.type === 'tutor' && authProfile?.tutor?.id === req.user.id);

      if (!authProfile || !belongsToAuthenticatedAccount) {
        return res.status(204).send();
      }

      await prisma.authProfile.updateMany({
        where: {
          id: authProfile.id,
          refreshToken,
        },
        data: { refreshToken: null },
      });

      return res.status(204).send();
    } catch {
      console.error('Erro ao revogar sessão.');
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },
};
