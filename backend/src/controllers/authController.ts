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

      // PASSO 1: Encontrar o AuthProfile, selecionando TODOS os campos que vamos precisar logo em seguida.
      const authProfile = await prisma.authProfile.findUnique({
        where: { email },
        select: {
          id: true,
          password: true,
          email: true,
          refreshToken: true,
          role: true,   // <-- Agora estamos pedindo o 'role'
          userId: true,  // <-- Agora estamos pedindo o 'userId'
          tutorId: true, // <-- Agora estamos pedindo o 'tutorId'
        }
      });

      if (!authProfile) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(password, authProfile.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // PASSO 2: Agora, com o authProfile em mãos, buscamos o User OU Tutor associado.
      let user;
      let tutor;
      
      // Verifica se o authProfile está ligado a um 'user' (funcionário)
      if (authProfile.userId) {
        user = await prisma.user.findUnique({
          where: { id: authProfile.userId },
          include: { role: true } // O include aqui funciona de forma simples e direta
        });
      }
      // Se não, verifica se está ligado a um 'tutor' (admin/dono)
      else if (authProfile.tutorId) {
        tutor = await prisma.tutor.findUnique({ where: { id: authProfile.tutorId } });
      }

      if (!user && !tutor) {
        return res.status(403).json({ message: 'Acesso negado. Perfil de autenticação não está associado a uma conta ativa.' });
      }

      // PASSO 3: Montar os payloads com os dados que AGORA temos certeza que existem.
      let tokenPayload;
      let userPayload;

      if (user) {
        const userRole = user.role?.name || 'FUNCIONARIO';
        tokenPayload = { id: user.id, type: 'user', role: userRole };
        userPayload = { id: user.id, name: user.name, email: authProfile.email, role: userRole, type: 'user' };
      } else if (tutor) {
        tokenPayload = { id: tutor.id, type: 'tutor', role: authProfile.role };
        userPayload = { id: tutor.id, name: tutor.name, email: authProfile.email, role: authProfile.role, type: 'tutor' };
      } else {
        return res.status(500).json({ message: "Erro crítico na configuração do perfil." });
      }

      // PASSO 4: Gerar tokens e responder (código que já tínhamos)
      const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ authProfileId: authProfile.id }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' });

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