import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { prisma as rawPrisma } from '../lib/prisma';

const prisma = rawPrisma as any;

const accessToken = jwt.sign(
  { id: 1, type: 'user', role: 'DONO', clinicId: 1 },
  process.env.JWT_SECRET as string,
  { algorithm: 'HS256', expiresIn: '5m' },
);

let createdTutorEmails: Set<string>;

const syntheticTutor = (data: any, id: number) => ({
  id,
  name: data.name,
  email: data.email,
  phone: data.phone ?? '',
  address: data.address ?? null,
  clinicId: 1,
  deletedAt: null,
});

describe('Tutors API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  beforeEach(() => {
    createdTutorEmails = new Set();
    prisma.user.findFirst.mockResolvedValue({ id: 1, clinicId: 1, roleName: 'DONO', active: true });
    prisma.tutor.findMany.mockResolvedValue([]);
    prisma.tutor.count.mockResolvedValue(0);
    prisma.tutor.create.mockImplementation(async ({ data }: any) => {
      const email = String(data.email).toLowerCase();
      if (createdTutorEmails.has(email)) {
        const error: any = new Error('duplicate synthetic tutor email');
        error.code = 'P2002';
        throw error;
      }
      createdTutorEmails.add(email);
      return syntheticTutor(data, 100 + createdTutorEmails.size);
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('GET /api/tutors', () => {
    it('should return list of tutors', async () => {
      const response = await request(app)
        .get('/api/tutors')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.headers['cache-control']).toContain('private');
      expect(response.headers['cache-control']).toContain('no-store');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/tutors?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('POST /api/tutors', () => {
    const validTutor = {
      name: 'João Silva',
      email: 'joao@test.com',
      phone: '11999999999',
      cpf: '12345678901',
      address: {
        street: 'Rua Teste',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567'
      }
    };

    it('should create a new tutor with valid data', async () => {
      const response = await request(app)
        .post('/api/tutors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTutor)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(validTutor.name);
      expect(response.body.email).toBe(validTutor.email);
    });

    it('should return 400 for invalid data', async () => {
      const invalidTutor = {
        name: '', // Nome vazio
        email: 'invalid-email', // Email inválido
      };

      await request(app)
        .post('/api/tutors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidTutor)
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      // Primeiro, criar um tutor
      await request(app)
        .post('/api/tutors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTutor);

      // Tentar criar outro com mesmo email
      await request(app)
        .post('/api/tutors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTutor)
        .expect(409);
    });
  });

  describe('GET /api/tutors/stats', () => {
    it('should return tutor statistics', async () => {
      const response = await request(app)
        .get('/api/tutors/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('newThisMonth');
      expect(typeof response.body.total).toBe('number');
    });
  });
});
