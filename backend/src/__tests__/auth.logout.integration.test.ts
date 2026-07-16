import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { app } from '../server';

const prisma = new PrismaClient() as any;

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    prisma.authProfile.findFirst.mockReset();
    prisma.authProfile.updateMany.mockReset();
    prisma.authProfile.updateMany.mockResolvedValue({ count: 1 });
  });

  it('requires a valid access token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'not-relevant-without-authentication' });

    expect(response.status).toBe(401);
    expect(prisma.authProfile.findFirst).not.toHaveBeenCalled();
  });

  it('revokes the refresh token through the authenticated route', async () => {
    const accessToken = jwt.sign(
      { id: 20, type: 'user', role: 'DONO' },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS256', expiresIn: '1h' },
    );
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

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(prisma.authProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 10, refreshToken },
      data: { refreshToken: null },
    });
  });
});
