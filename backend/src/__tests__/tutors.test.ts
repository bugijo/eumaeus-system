import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tutors API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('GET /api/tutors', () => {
    it('should return list of tutors', async () => {
      const response = await request(app)
        .get('/api/tutors')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/tutors?page=1&limit=5')
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
        .send(invalidTutor)
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      // Primeiro, criar um tutor
      await request(app)
        .post('/api/tutors')
        .send(validTutor);

      // Tentar criar outro com mesmo email
      await request(app)
        .post('/api/tutors')
        .send(validTutor)
        .expect(409);
    });
  });

  describe('GET /api/tutors/stats', () => {
    it('should return tutor statistics', async () => {
      const response = await request(app)
        .get('/api/tutors/stats')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('newThisMonth');
      expect(typeof response.body.total).toBe('number');
    });
  });
});