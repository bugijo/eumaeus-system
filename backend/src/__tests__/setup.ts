process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/eumaeus_test';
process.env.JWT_SECRET = 'local-ci-access-key-2026-07-13-alpha';
process.env.REFRESH_TOKEN_SECRET = 'local-ci-refresh-key-2026-07-13-beta';

import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    authProfile: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    role: {
      upsert: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tutor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    pet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    medicalRecord: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    medicalRecordProduct: {
      createMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
    service: { findFirst: jest.fn() },
    invoice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    payment: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    communicationOutbox: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    communicationAttempt: { create: jest.fn() },
    tutorCommunicationPreference: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    vaccinationRecord: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    packageSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    servicePackage: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    packageContract: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    specialistProfile: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    specialistAvailability: { create: jest.fn() },
    specialistAssignment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    invoiceItem: { findFirst: jest.fn() },
    clinicSettings: { findFirst: jest.fn() },
    prescription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    prescriptionItem: { createMany: jest.fn() },
    resultCenter: { findFirst: jest.fn() },
    expense: { findMany: jest.fn(), create: jest.fn() },
    financialAuditEvent: { create: jest.fn() },
  };

  mockPrisma.$transaction.mockImplementation((callback: (tx: any) => unknown) => callback(mockPrisma));

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' }, Decimal: class Decimal { value: number; constructor(value: unknown) { this.value = Number(value); } plus(other: any) { return new (this.constructor as any)(this.value + Number(other.value ?? other)); } greaterThan(other: any) { return this.value > Number(other.value ?? other); } equals(other: any) { return this.value === Number(other.value ?? other); } toString() { return this.value.toFixed(2); } } },
  };
});

// Setup global test environment
beforeAll(async () => {
  // Setup test database or mocks
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  // Cleanup
  console.log('🧹 Cleaning up test environment...');
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
