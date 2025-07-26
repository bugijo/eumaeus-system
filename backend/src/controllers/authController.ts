// Em /src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'REFRESH_SEGREDO_SUPER_SECRETO';

export default {
  async login(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      // 1. Busca pelo perfil de autenticação, incluindo apenas usuários (funcionários)
      const authProfile = await prisma.authProfile.findUnique({
        where: { email },
        include: {
          user: { include: { role: true } }, // Inclui o User e seu Cargo (Role)
        },
      });

      if (!authProfile) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(password, authProfile.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // 2. Verifica se é um funcionário da clínica
      if (!authProfile.user) {
        return res.status(403).json({ message: 'Acesso negado. Apenas funcionários podem fazer login.' });
      }

      // 3. Monta os payloads do token e do usuário
      const tokenPayload = { id: authProfile.user.id, type: 'user', role: authProfile.user.role.name };
      const userPayload = { id: authProfile.user.id, name: authProfile.user.name, email: authProfile.email, role: authProfile.user.role.name, type: 'user' };

      // 4. Gera os tokens
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ authProfileId: authProfile.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' });

      // Atualiza o refresh token no perfil de autenticação
      await prisma.authProfile.update({
        where: { id: authProfile.id },
        data: { refreshToken },
      });
      
      return res.status(200).json({ accessToken, refreshToken, user: userPayload });

    } catch (error) {
      console.error("Erro no login:", error);
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
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { authProfileId: number };
      } catch (error) {
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
      const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ authProfileId: authProfile.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' });

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
    } catch (error) {
      console.error('Erro no refresh:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};