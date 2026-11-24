import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import authController, { hashRefreshToken } from '../controllers/authController';

const createResponse = () => {
  const res: any = { status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
};

const db = prisma as any;

describe('Auditoria: login não revela se o e-mail existe', () => {
  it('roda o bcrypt mesmo quando o e-mail não existe e responde igual', async () => {
    const compare = jest.spyOn(bcrypt, 'compare');
    db.authProfile.findUnique.mockResolvedValueOnce(null);
    const res = createResponse();
    await authController.login({ body: { email: 'ninguem@example.invalid', password: 'senha-qualquer-123' } } as Request, res);
    expect(compare).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas' });
    compare.mockRestore();
  });

  it('guarda o refresh token como hash no login', async () => {
    const password = 'senha-correta-123';
    db.authProfile.findUnique.mockResolvedValueOnce({
      id: 10, email: 'a@example.invalid', password: await bcrypt.hash(password, 4),
      user: { id: 1, name: 'A', clinicId: 1, active: true, role: { name: 'DONO' } }, tutor: null,
    });
    db.authProfile.update.mockResolvedValueOnce({});
    const res = createResponse();
    await authController.login({ body: { email: 'a@example.invalid', password } } as Request, res);
    const { refreshToken } = res.json.mock.calls[0][0];
    expect(db.authProfile.update).toHaveBeenCalledWith({ where: { id: 10 }, data: { refreshToken: hashRefreshToken(refreshToken) } });
    expect(hashRefreshToken(refreshToken)).not.toContain(refreshToken);
  });
});

describe('Auditoria: rotação do refresh token é atômica', () => {
  const token = () => jwt.sign({ authProfileId: 10 }, process.env.REFRESH_TOKEN_SECRET as string, { algorithm: 'HS256', expiresIn: '1h' });
  const profile = { id: 10, email: 'a@example.invalid', user: { id: 1, name: 'A', clinicId: 1, active: true, role: { name: 'DONO' } } };

  it('recusa quando outra renovação já trocou o token (count 0)', async () => {
    db.authProfile.findFirst.mockResolvedValueOnce(profile);
    db.authProfile.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = createResponse();
    await authController.refresh({ body: { refreshToken: token() } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('troca condicionada ao token atual e grava só o hash do novo', async () => {
    const current = token();
    db.authProfile.findFirst.mockResolvedValueOnce(profile);
    db.authProfile.updateMany.mockResolvedValueOnce({ count: 1 });
    const res = createResponse();
    await authController.refresh({ body: { refreshToken: current } } as Request, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const issued = res.json.mock.calls[0][0].refreshToken;
    expect(db.authProfile.findFirst.mock.calls.at(-1)[0].where).toEqual({ id: 10, refreshToken: { in: [hashRefreshToken(current), current] } });
    expect(db.authProfile.updateMany.mock.calls.at(-1)[0]).toEqual({
      where: { id: 10, refreshToken: { in: [hashRefreshToken(current), current] } },
      data: { refreshToken: hashRefreshToken(issued) },
    });
  });
});
