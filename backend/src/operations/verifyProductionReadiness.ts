import type { PrismaClient } from '@prisma/client';
import { validateRequiredRuntimeEnvironment } from '../config/runtimeEnvironment';

export const PRODUCTION_VERIFY_CONFIRMATION = 'RUN_READ_ONLY_PRODUCTION_CHECK';

export const OFFICIAL_PRODUCTION_MIGRATIONS = Object.freeze([
  {
    name: 'init-postgres',
    checksum: 'e04aa4664d3de56fdf0e28dd7f54cd089b6ecf8fef805a27e0f9bea1c185f3b3',
  },
  {
    name: 'z_20260713000000_fix_clinic_settings_defaults',
    checksum: '1d4ce1e5c309794dd9b54192ac841e6d0ebd1ec126fdcb71e857752a8d489dda',
  },
]);

export type ProductionVerificationOptions = {
  expectEmptyBusinessData: boolean;
  expectOwner: boolean;
};

export type ProductionVerificationReport = {
  database: 'ok';
  migrations: {
    expected: number;
    applied: number;
    failed: number;
    missing: number;
    unexpected: number;
    checksumMismatches: number;
  };
  identity: {
    users: number;
    authProfiles: number;
    ownerAccounts: number;
    activeRefreshTokens: number;
  };
  businessRecords: {
    appointments: number;
    clinicSettings: number;
    invoices: number;
    invoiceItems: number;
    medicalRecords: number;
    medicalRecordProducts: number;
    pets: number;
    products: number;
    services: number;
    tutors: number;
  };
  expectations: {
    emptyBusinessData: boolean;
    ownerProvisioned: boolean;
  };
};

const requiredValue = (name: string, environment: NodeJS.ProcessEnv): string => {
  const value = environment[name];
  if (!value || value.trim() !== value) {
    throw new Error(`${name} é obrigatória`);
  }
  return value;
};

const explicitBoolean = (name: string, environment: NodeJS.ProcessEnv): boolean => {
  const value = requiredValue(name, environment).toLowerCase();
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${name} deve ser true ou false`);
  }
  return value === 'true';
};

export const loadProductionVerificationOptions = (
  environment: NodeJS.ProcessEnv = process.env,
): ProductionVerificationOptions => {
  validateRequiredRuntimeEnvironment(environment);

  const nodeEnvironment = requiredValue('NODE_ENV', environment).toLowerCase();
  if (!new Set(['production', 'test']).has(nodeEnvironment)) {
    throw new Error('NODE_ENV deve ser production; test é aceito apenas pela automação isolada');
  }

  if (requiredValue('PRODUCTION_VERIFY_CONFIRMATION', environment) !== PRODUCTION_VERIFY_CONFIRMATION) {
    throw new Error(`PRODUCTION_VERIFY_CONFIRMATION deve ser ${PRODUCTION_VERIFY_CONFIRMATION}`);
  }

  return {
    expectEmptyBusinessData: explicitBoolean('VERIFY_EXPECT_EMPTY_BUSINESS_DATA', environment),
    expectOwner: explicitBoolean('VERIFY_EXPECT_OWNER', environment),
  };
};

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

export const verifyProductionReadiness = async (
  client: PrismaClient,
  options: ProductionVerificationOptions,
): Promise<ProductionVerificationReport> => {
  await client.$queryRaw`SELECT 1`;

  const snapshot = await client.$transaction(async (transaction) => {
    const migrationRows = await transaction.$queryRaw<MigrationRow[]>`
      SELECT migration_name, checksum, finished_at, rolled_back_at
      FROM "_prisma_migrations"
    `;

    const [
      users,
      authProfiles,
      ownerAccounts,
      activeRefreshTokens,
      tutors,
      pets,
      appointments,
      clinicSettings,
      medicalRecords,
      medicalRecordProducts,
      products,
      services,
      invoices,
      invoiceItems,
    ] = await Promise.all([
      transaction.user.count(),
      transaction.authProfile.count(),
      transaction.user.count({ where: { roleName: 'DONO' } }),
      transaction.authProfile.count({ where: { refreshToken: { not: null } } }),
      transaction.tutor.count(),
      transaction.pet.count(),
      transaction.appointment.count(),
      transaction.clinicSettings.count(),
      transaction.medicalRecord.count(),
      transaction.medicalRecordProduct.count(),
      transaction.product.count(),
      transaction.service.count(),
      transaction.invoice.count(),
      transaction.invoiceItem.count(),
    ]);

    return {
      migrationRows,
      users,
      authProfiles,
      ownerAccounts,
      activeRefreshTokens,
      tutors,
      pets,
      appointments,
      clinicSettings,
      medicalRecords,
      medicalRecordProducts,
      products,
      services,
      invoices,
      invoiceItems,
    };
  }, { isolationLevel: 'RepeatableRead' });

  const {
    migrationRows,
    users,
    authProfiles,
    ownerAccounts,
    activeRefreshTokens,
    tutors,
    pets,
    appointments,
    clinicSettings,
    medicalRecords,
    medicalRecordProducts,
    products,
    services,
    invoices,
    invoiceItems,
  } = snapshot;

  const businessRecords = {
    appointments,
    clinicSettings,
    invoices,
    invoiceItems,
    medicalRecords,
    medicalRecordProducts,
    pets,
    products,
    services,
    tutors,
  };
  const businessRecordTotal = Object.values(businessRecords).reduce((sum, count) => sum + count, 0);
  const successfulMigrations = migrationRows.filter(
    (migration) => migration.finished_at !== null && migration.rolled_back_at === null,
  );
  const failedMigrations = migrationRows.length - successfulMigrations.length;
  const successfulByName = new Map(
    successfulMigrations.map((migration) => [migration.migration_name, migration]),
  );
  const missingMigrations = OFFICIAL_PRODUCTION_MIGRATIONS.filter(
    (expected) => !successfulByName.has(expected.name),
  ).length;
  const checksumMismatches = OFFICIAL_PRODUCTION_MIGRATIONS.filter((expected) => {
    const actual = successfulByName.get(expected.name);
    return actual !== undefined && actual.checksum !== expected.checksum;
  }).length;
  const expectedNames = new Set(OFFICIAL_PRODUCTION_MIGRATIONS.map((migration) => migration.name));
  const unexpectedMigrations = successfulMigrations.filter(
    (migration) => !expectedNames.has(migration.migration_name),
  ).length;
  const migrationsReady = (
    successfulMigrations.length === OFFICIAL_PRODUCTION_MIGRATIONS.length &&
    migrationRows.length === OFFICIAL_PRODUCTION_MIGRATIONS.length &&
    failedMigrations === 0 &&
    missingMigrations === 0 &&
    unexpectedMigrations === 0 &&
    checksumMismatches === 0
  );
  const identityReady = options.expectOwner
    ? users === 1 && authProfiles === 1 && ownerAccounts === 1
    : users === 0 && authProfiles === 0 && ownerAccounts === 0;

  const report: ProductionVerificationReport = {
    database: 'ok',
    migrations: {
      expected: OFFICIAL_PRODUCTION_MIGRATIONS.length,
      applied: successfulMigrations.length,
      failed: failedMigrations,
      missing: missingMigrations,
      unexpected: unexpectedMigrations,
      checksumMismatches,
    },
    identity: {
      users,
      authProfiles,
      ownerAccounts,
      activeRefreshTokens,
    },
    businessRecords,
    expectations: {
      emptyBusinessData: !options.expectEmptyBusinessData || businessRecordTotal === 0,
      ownerProvisioned: identityReady,
    },
  };

  if (
    !migrationsReady ||
    activeRefreshTokens > 0 ||
    !report.expectations.emptyBusinessData ||
    !report.expectations.ownerProvisioned
  ) {
    throw new Error('Verificação de prontidão recusada; consulte apenas as contagens sanitizadas');
  }

  return report;
};
