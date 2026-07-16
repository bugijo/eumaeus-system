import request from 'supertest';
import { prisma } from '../lib/prisma';
import { app } from '../server';

const queryRawMock = prisma.$queryRaw as jest.Mock;

describe('Health Endpoints', () => {
  beforeEach(() => {
    queryRawMock.mockResolvedValue([{ result: 1 }]);
  });

  it.each(['/health', '/api/health'])(
    'returns application and database readiness for %s',
    async (path) => {
      const response = await request(app)
        .get(path)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        checks: {
          application: { status: 'ok' },
          database: { status: 'ok' },
        },
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.headers['cache-control']).toContain('private');
      expect(response.headers['cache-control']).toContain('no-store');
    },
  );

  it('returns 503 without leaking database errors when the database is unavailable', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('sensitive connection detail'));

    const response = await request(app)
      .get('/health')
      .expect(503);

    expect(response.body).toMatchObject({
      status: 'error',
      checks: {
        application: { status: 'error' },
        database: { status: 'error' },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('sensitive connection detail');
  });

  it('returns 503 when PostgreSQL is reachable but the application schema is absent', async () => {
    queryRawMock
      .mockResolvedValueOnce([{ result: 1 }])
      .mockRejectedValueOnce(new Error('relation AuthProfile does not exist'));

    const response = await request(app)
      .get('/health')
      .expect(503);

    expect(response.body).toMatchObject({
      status: 'error',
      checks: {
        application: { status: 'error' },
        database: { status: 'ok' },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('AuthProfile');
  });

  it('marks protected API responses as private and non-cacheable', async () => {
    const response = await request(app)
      .get('/api/tutors')
      .expect(401);

    expect(response.headers['cache-control']).toContain('private');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers.pragma).toBe('no-cache');
  });
});
