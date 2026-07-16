import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authController, { shouldRejectProductionPassword } from '../controllers/authController';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
  },
}));

const prisma = new PrismaClient() as any;
const comparePassword = bcrypt.compare as unknown as jest.Mock;

const createResponse = (): Response => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  } as unknown as Response;

  (response.status as jest.Mock).mockReturnValue(response);
  (response.json as jest.Mock).mockReturnValue(response);
  (response.send as jest.Mock).mockReturnValue(response);
  return response;
};

const getJsonPayload = (response: Response): any => (
  (response.json as jest.Mock).mock.calls[0][0]
);

describe('auth controller token security', () => {
  beforeEach(() => {
    comparePassword.mockResolvedValue(true);
    prisma.authProfile.findUnique.mockReset();
    prisma.authProfile.findFirst.mockReset();
    prisma.authProfile.update.mockReset();
    prisma.authProfile.update.mockResolvedValue({});
    prisma.authProfile.updateMany.mockReset();
    prisma.authProfile.updateMany.mockResolvedValue({ count: 1 });
  });

  it('issues access and refresh tokens using HS256', async () => {
    prisma.authProfile.findUnique.mockResolvedValue({
      id: 10,
      email: 'staff@example.invalid',
      password: 'stored-password-hash',
      user: {
        id: 20,
        name: 'Test Staff',
        role: { name: 'DONO' },
      },
      tutor: null,
    });

    const request = {
      body: { email: 'staff@example.invalid', password: 'submitted-password' },
    } as Request;
    const response = createResponse();

    await authController.login(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    const payload = getJsonPayload(response);
    const accessHeader = jwt.decode(payload.accessToken, { complete: true })?.header;
    const refreshHeader = jwt.decode(payload.refreshToken, { complete: true })?.header;

    expect(accessHeader?.alg).toBe('HS256');
    expect(refreshHeader?.alg).toBe('HS256');
    expect(() => jwt.verify(payload.accessToken, process.env.JWT_SECRET as string, {
      algorithms: ['HS256'],
    })).not.toThrow();
    expect(() => jwt.verify(payload.refreshToken, process.env.REFRESH_TOKEN_SECRET as string, {
      algorithms: ['HS256'],
    })).not.toThrow();
  });

  it('rejects legacy short passwords in production before database access', () => {
    expect(shouldRejectProductionPassword('short-password', 'production')).toBe(false);
    expect(shouldRejectProductionPassword('short', ' Production ')).toBe(true);
    expect(shouldRejectProductionPassword('short', 'test')).toBe(false);
  });

  it('returns 401 for an expired refresh token', async () => {
    const expiredToken = jwt.sign(
      { authProfileId: 10 },
      process.env.REFRESH_TOKEN_SECRET as string,
      { algorithm: 'HS256', expiresIn: -1 },
    );
    const response = createResponse();

    await authController.refresh({ body: { refreshToken: expiredToken } } as Request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(prisma.authProfile.findFirst).not.toHaveBeenCalled();
  });

  it('returns 401 for a refresh token signed with another algorithm', async () => {
    const wrongAlgorithmToken = jwt.sign(
      { authProfileId: 10 },
      process.env.REFRESH_TOKEN_SECRET as string,
      { algorithm: 'HS384' },
    );
    const response = createResponse();

    await authController.refresh(
      { body: { refreshToken: wrongAlgorithmToken } } as Request,
      response,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(prisma.authProfile.findFirst).not.toHaveBeenCalled();
  });

  it('revokes a stored refresh token for the authenticated account', async () => {
    const refreshToken = jwt.sign(
      { authProfileId: 10 },
      process.env.REFRESH_TOKEN_SECRET as string,
      { algorithm: 'HS256', expiresIn: '1h' },
    );
    prisma.authProfile.findFirst.mockResolvedValue({
      id: 10,
      user: { id: 20 },
      tutor: null,
    });
    const request = {
      body: { refreshToken },
      user: { id: 20, type: 'user', role: 'DONO' },
    } as AuthenticatedRequest;
    const response = createResponse();

    await authController.logout(request, response);

    expect(prisma.authProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 10, refreshToken },
      data: { refreshToken: null },
    });
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it('treats a nonexistent refresh token as an idempotent logout', async () => {
    const request = {
      body: { refreshToken: 'not-a-token' },
      user: { id: 20, type: 'user', role: 'DONO' },
    } as AuthenticatedRequest;
    const response = createResponse();

    await authController.logout(request, response);

    expect(prisma.authProfile.findFirst).not.toHaveBeenCalled();
    expect(prisma.authProfile.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it('treats an already revoked refresh token as an idempotent logout', async () => {
    const refreshToken = jwt.sign(
      { authProfileId: 10 },
      process.env.REFRESH_TOKEN_SECRET as string,
      { algorithm: 'HS256', expiresIn: '1h' },
    );
    prisma.authProfile.findFirst.mockResolvedValue(null);
    const request = {
      body: { refreshToken },
      user: { id: 20, type: 'user', role: 'DONO' },
    } as AuthenticatedRequest;
    const response = createResponse();

    await authController.logout(request, response);

    expect(prisma.authProfile.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(204);
  });
});
