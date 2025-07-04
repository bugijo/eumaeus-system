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

      // 1. Encontrar o usuário pelo email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' }); // Usuário não encontrado
      }

      // 2. Comparar a senha enviada com a senha criptografada no banco
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' }); // Senha incorreta
      }

      // 3. Gerar AMBOS os tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.roleName },
        JWT_SECRET,
        { expiresIn: '15m' } // Access token com validade curta (15 minutos)
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '30d' } // Refresh token com validade longa (30 dias)
      );

      // 4. Salvar o refresh token no usuário
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken },
      });

      // 5. Enviar ambos os tokens para o frontend
      return res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roleName,
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
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
        decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: number };
      } catch (error) {
        return res.status(401).json({ message: 'Refresh token inválido' });
      }

      // 2. Verificar se o refresh token existe no banco e pertence ao usuário
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          refreshToken: refreshToken,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'Refresh token não encontrado' });
      }

      // 3. Gerar um novo access token
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.roleName },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // 4. Opcionalmente, gerar um novo refresh token (rotação de tokens)
      const newRefreshToken = jwt.sign(
        { userId: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '30d' }
      );

      // 5. Atualizar o refresh token no banco
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      // 6. Enviar os novos tokens
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roleName,
        },
      });
    } catch (error) {
      console.error('Erro no refresh:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};