import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRoles,
  ROLE,
} from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

const createResponse = (): Response => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;

  (response.status as jest.Mock).mockReturnValue(response);
  (response.json as jest.Mock).mockReturnValue(response);
  return response;
};

const createRequest = (authorization?: string): AuthenticatedRequest => ({
  headers: authorization ? { authorization } : {},
} as AuthenticatedRequest);

const signAccessToken = (
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
): string => jwt.sign(payload, process.env.JWT_SECRET as string, {
  algorithm: 'HS256',
  ...options,
});

describe('authentication middleware security', () => {
  let response: Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    response = createResponse();
    next = jest.fn();
  });

  it('returns 401 when the access token is absent', () => {
    authenticateToken(createRequest(), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the authorization scheme is invalid', () => {
    const token = signAccessToken({ id: 1, type: 'user', role: ROLE.DONO });

    authenticateToken(createRequest(`Basic ${token}`), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token is expired', () => {
    const token = signAccessToken(
      { id: 1, type: 'user', role: ROLE.DONO },
      { expiresIn: -1 },
    );

    authenticateToken(createRequest(`Bearer ${token}`), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token uses an algorithm other than HS256', () => {
    const token = jwt.sign(
      { id: 1, type: 'user', role: ROLE.DONO },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS384' },
    );

    authenticateToken(createRequest(`Bearer ${token}`), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when required claims are invalid', () => {
    const token = signAccessToken({ id: 1, type: 'service', role: ROLE.DONO });

    authenticateToken(createRequest(`Bearer ${token}`), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid HS256 access token', () => {
    const request = createRequest(`Bearer ${signAccessToken({
      id: 1,
      type: 'user',
      role: ROLE.DONO,
    })}`);

    authenticateToken(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(request.user).toMatchObject({ id: 1, type: 'user', role: ROLE.DONO });
    expect(response.status).not.toHaveBeenCalled();
  });

  it('reserves 403 for an authenticated RBAC denial', () => {
    const token = signAccessToken({ id: 1, type: 'user', role: ROLE.RECEPCAO });
    const middleware = requireRoles(ROLE.DONO);

    middleware(createRequest(`Bearer ${token}`), response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a signed token when the user no longer exists', async () => {
    const token = signAccessToken({ id: 999, type: 'user', role: ROLE.DONO, clinicId: 1 });
    const middleware = requireRoles(ROLE.DONO);

    middleware(createRequest(`Bearer ${token}`), response, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Acesso revogado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token whose role was revoked after issuance', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ active: true, roleName: ROLE.RECEPCAO });
    const token = signAccessToken({ id: 10, type: 'user', role: ROLE.DONO, clinicId: 1 });
    const middleware = requireRoles(ROLE.DONO);

    middleware(createRequest(`Bearer ${token}`), response, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ message: 'Permissão insuficiente para esta operação' });
    expect(next).not.toHaveBeenCalled();
  });
});
