import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  OFFICIAL_PRODUCTION_MIGRATIONS,
  PRODUCTION_VERIFY_CONFIRMATION,
  loadProductionVerificationOptions,
  verifyProductionReadiness,
} from '../operations/verifyProductionReadiness';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://verify_test:local_only@localhost:5432/eumaeus_verify_test',
  JWT_SECRET: 'unit-test-access-secret-verify-alpha-2026',
  REFRESH_TOKEN_SECRET: 'unit-test-refresh-secret-verify-beta-2026',
  PRODUCTION_VERIFY_CONFIRMATION: PRODUCTION_VERIFY_CONFIRMATION,
  VERIFY_EXPECT_EMPTY_BUSINESS_DATA: 'true',
  VERIFY_EXPECT_OWNER: 'true',
});

type MigrationFixture = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

const officialMigrationRows = (): MigrationFixture[] => OFFICIAL_PRODUCTION_MIGRATIONS.map(
  (migration) => ({
    migration_name: migration.name,
    checksum: migration.checksum,
    finished_at: new Date('2026-07-16T12:00:00.000Z'),
    rolled_back_at: null,
  }),
);

const clientFixture = ({
  activeRefreshTokens = 0,
  authProfiles = 1,
  businessCount = 0,
  migrationRows = officialMigrationRows(),
  ownerAccounts = 1,
  users = 1,
}: {
  activeRefreshTokens?: number;
  authProfiles?: number;
  businessCount?: number;
  migrationRows?: MigrationFixture[];
  ownerAccounts?: number;
  users?: number;
} = {}): PrismaClient => {
  let client: PrismaClient;
  const transaction = jest.fn(async (
    callback: (transactionClient: PrismaClient) => Promise<unknown>,
  ): Promise<unknown> => callback(client));
  const fixture = {
    $queryRaw: jest.fn()
      .mockResolvedValueOnce([{ result: 1 }])
      .mockResolvedValueOnce(migrationRows),
    $transaction: transaction,
    user: {
      count: jest.fn().mockImplementation((query?: { where?: unknown }) => (
        query?.where ? ownerAccounts : users
      )),
    },
    authProfile: {
      count: jest.fn().mockImplementation((query?: { where?: unknown }) => (
        query?.where ? activeRefreshTokens : authProfiles
      )),
    },
    tutor: { count: jest.fn().mockResolvedValue(businessCount) },
    pet: { count: jest.fn().mockResolvedValue(0) },
    appointment: { count: jest.fn().mockResolvedValue(0) },
    clinicSettings: { count: jest.fn().mockResolvedValue(0) },
    medicalRecord: { count: jest.fn().mockResolvedValue(0) },
    medicalRecordProduct: { count: jest.fn().mockResolvedValue(0) },
    product: { count: jest.fn().mockResolvedValue(0) },
    service: { count: jest.fn().mockResolvedValue(0) },
    invoice: { count: jest.fn().mockResolvedValue(0) },
    invoiceItem: { count: jest.fn().mockResolvedValue(0) },
  };

  client = fixture as unknown as PrismaClient;
  return client;
};

describe('production readiness verification', () => {
  it('requires explicit read-only expectations', () => {
    const environment = validEnvironment();
    delete environment.VERIFY_EXPECT_OWNER;

    expect(() => loadProductionVerificationOptions(environment)).toThrow('VERIFY_EXPECT_OWNER');
  });

  it('keeps the migration manifest checksums aligned with the official SQL files', () => {
    for (const migration of OFFICIAL_PRODUCTION_MIGRATIONS) {
      const migrationFile = path.resolve(
        __dirname,
        '../../prisma/migrations',
        migration.name,
        'migration.sql',
      );
      const checksum = createHash('sha256').update(readFileSync(migrationFile)).digest('hex');
      expect(checksum).toBe(migration.checksum);
    }
  });

  it('returns only aggregate readiness information', async () => {
    const report = await verifyProductionReadiness(clientFixture(), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    });

    expect(report).toEqual(expect.objectContaining({
      database: 'ok',
      migrations: {
        expected: 2,
        applied: 2,
        failed: 0,
        missing: 0,
        unexpected: 0,
        checksumMismatches: 0,
      },
      identity: {
        users: 1,
        authProfiles: 1,
        ownerAccounts: 1,
        activeRefreshTokens: 0,
      },
      expectations: { emptyBusinessData: true, ownerProvisioned: true },
    }));
    expect(JSON.stringify(report)).not.toContain('@');
    expect(JSON.stringify(report)).not.toMatch(/postgres(?:ql)?:\/\//i);
  });

  it('fails when an official migration is missing', async () => {
    await expect(verifyProductionReadiness(clientFixture({
      migrationRows: officialMigrationRows().slice(0, 1),
    }), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    })).rejects.toThrow('Verificação de prontidão recusada');
  });

  it('fails when an official migration checksum differs', async () => {
    const migrations = officialMigrationRows();
    migrations[1].checksum = 'checksum-diferente';

    await expect(verifyProductionReadiness(clientFixture({ migrationRows: migrations }), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    })).rejects.toThrow('Verificação de prontidão recusada');
  });

  it('fails when old business data appears in a database expected to be empty', async () => {
    await expect(verifyProductionReadiness(clientFixture({ businessCount: 1 }), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    })).rejects.toThrow('Verificação de prontidão recusada');
  });

  it('fails when extra users or authentication profiles exist', async () => {
    await expect(verifyProductionReadiness(clientFixture({ users: 2, authProfiles: 2 }), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    })).rejects.toThrow('Verificação de prontidão recusada');
  });

  it('fails when any account has an active refresh token', async () => {
    await expect(verifyProductionReadiness(clientFixture({ activeRefreshTokens: 1 }), {
      expectEmptyBusinessData: true,
      expectOwner: true,
    })).rejects.toThrow('Verificação de prontidão recusada');
  });
});
