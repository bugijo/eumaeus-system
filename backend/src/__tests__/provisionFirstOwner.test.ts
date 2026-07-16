import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import {
  FIRST_OWNER_CONFIRMATION,
  FirstOwnerInput,
  loadFirstOwnerInput,
  provisionFirstOwner,
} from '../operations/provisionFirstOwner';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://owner_test:local_only@localhost:5432/eumaeus_owner_test',
  JWT_SECRET: 'unit-test-access-secret-owner-alpha-2026',
  REFRESH_TOKEN_SECRET: 'unit-test-refresh-secret-owner-beta-2026',
  PROVISION_FIRST_OWNER_CONFIRMATION: FIRST_OWNER_CONFIRMATION,
  INITIAL_OWNER_NAME: 'Responsável inicial',
  INITIAL_OWNER_EMAIL: 'owner@example.invalid',
  INITIAL_OWNER_PASSWORD: 'Local-only!Steward#9472',
});

const validInput = (): FirstOwnerInput => ({
  name: 'Responsável inicial',
  email: 'owner@example.invalid',
  password: 'Local-only!Steward#9472',
});

const transactionFixture = () => ({
  $queryRaw: jest.fn().mockResolvedValue([{ pg_advisory_xact_lock: null }]),
  user: {
    count: jest.fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  authProfile: {
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  role: {
    upsert: jest.fn().mockResolvedValue({ name: 'DONO' }),
  },
  tutor: { count: jest.fn().mockResolvedValue(0) },
  pet: { count: jest.fn().mockResolvedValue(0) },
  appointment: { count: jest.fn().mockResolvedValue(0) },
  medicalRecord: { count: jest.fn().mockResolvedValue(0) },
  medicalRecordProduct: { count: jest.fn().mockResolvedValue(0) },
  product: { count: jest.fn().mockResolvedValue(0) },
  service: { count: jest.fn().mockResolvedValue(0) },
  invoice: { count: jest.fn().mockResolvedValue(0) },
  invoiceItem: { count: jest.fn().mockResolvedValue(0) },
  clinicSettings: { count: jest.fn().mockResolvedValue(0) },
});

const clientFixture = (transaction: ReturnType<typeof transactionFixture>) => ({
  $transaction: jest.fn(async (operation: (value: typeof transaction) => Promise<void>) => (
    operation(transaction)
  )),
}) as unknown as PrismaClient;

describe('first owner input', () => {
  it.each([
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'NODE_ENV',
    'PROVISION_FIRST_OWNER_CONFIRMATION',
    'INITIAL_OWNER_NAME',
    'INITIAL_OWNER_EMAIL',
    'INITIAL_OWNER_PASSWORD',
  ])('fails closed when %s is absent', (variable) => {
    const environment = validEnvironment();
    delete environment[variable];

    expect(() => loadFirstOwnerInput(environment)).toThrow(variable);
  });

  it('requires the explicit confirmation phrase', () => {
    const environment = validEnvironment();
    environment.PROVISION_FIRST_OWNER_CONFIRMATION = 'yes';

    expect(() => loadFirstOwnerInput(environment)).toThrow('PROVISION_FIRST_OWNER_CONFIRMATION');
  });

  it.each([
    'owner',
    'alllowercase-with-symbol!42',
    'ALLUPPERCASE-WITH-SYMBOL!42',
    'NoNumber-With-Symbol!',
    'NoSymbolWithNumber42',
    'Eumaeus-Owner!9472',
  ])('rejects an unsafe password without exposing it', (submittedPassword) => {
    const environment = validEnvironment();
    environment.INITIAL_OWNER_PASSWORD = submittedPassword;

    try {
      loadFirstOwnerInput(environment);
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(String(error)).not.toContain(submittedPassword);
    }
  });

  it('accepts valid input and removes the plaintext password from process-like state', () => {
    const environment = validEnvironment();

    const input = loadFirstOwnerInput(environment);

    expect(input).toMatchObject({
      name: 'Responsável inicial',
      email: 'owner@example.invalid',
    });
    expect(environment.INITIAL_OWNER_PASSWORD).toBeUndefined();
  });

  it('fails through the sanitized CLI boundary before importing Prisma', () => {
    const submittedPassword = 'Process-only!Steward#9472';
    const result = spawnSync(
      process.execPath,
      ['-r', 'ts-node/register', 'src/commands/provisionFirstOwner.ts'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: 'true',
          NODE_ENV: 'production',
          DATABASE_URL: 'not-a-postgresql-url',
          JWT_SECRET: 'process-test-access-secret-owner-alpha-2026',
          REFRESH_TOKEN_SECRET: 'process-test-refresh-secret-owner-beta-2026',
          PROVISION_FIRST_OWNER_CONFIRMATION: FIRST_OWNER_CONFIRMATION,
          INITIAL_OWNER_NAME: 'Responsável sintético',
          INITIAL_OWNER_EMAIL: 'process-owner@example.invalid',
          INITIAL_OWNER_PASSWORD: submittedPassword,
        },
      },
    );

    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).toBe(1);
    expect(output).toContain('Provisionamento falhou sem gravar detalhes sensíveis');
    expect(output).not.toContain(submittedPassword);
    expect(output).not.toMatch(/\n\s*at\s/u);
  });
});

describe('first owner provisioning', () => {
  it('creates one owner transactionally with no refresh token', async () => {
    const transaction = transactionFixture();
    const client = clientFixture(transaction);
    const hashPassword = jest.fn().mockResolvedValue('local-bcrypt-hash-placeholder');

    await provisionFirstOwner(client, validInput(), hashPassword);

    expect(client.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledWith(validInput().password, 12);
    expect(transaction.role.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: 'DONO' },
    }));
    expect(transaction.authProfile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        password: 'local-bcrypt-hash-placeholder',
        refreshToken: null,
      }),
    }));
    expect(transaction.authProfile.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ password: validInput().password }) }),
    );
    expect(transaction.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ roleName: 'DONO', clinicId: 1 }),
    }));
  });

  it('refuses a second owner before any write', async () => {
    const transaction = transactionFixture();
    transaction.user.count
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    const client = clientFixture(transaction);

    await expect(provisionFirstOwner(
      client,
      validInput(),
      jest.fn().mockResolvedValue('local-bcrypt-hash-placeholder'),
    )).rejects.toThrow('já existe uma conta DONO');

    expect(transaction.role.upsert).not.toHaveBeenCalled();
    expect(transaction.authProfile.create).not.toHaveBeenCalled();
    expect(transaction.user.create).not.toHaveBeenCalled();
  });

  it('refuses an unexpectedly pre-populated database', async () => {
    const transaction = transactionFixture();
    transaction.tutor.count.mockResolvedValue(1);
    const client = clientFixture(transaction);

    await expect(provisionFirstOwner(
      client,
      validInput(),
      jest.fn().mockResolvedValue('local-bcrypt-hash-placeholder'),
    )).rejects.toThrow('contém contas ou dados inesperados');

    expect(transaction.authProfile.create).not.toHaveBeenCalled();
    expect(transaction.user.create).not.toHaveBeenCalled();
  });

  it('does not log identity or password values', async () => {
    const transaction = transactionFixture();
    const client = clientFixture(transaction);
    const stdout = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await provisionFirstOwner(
      client,
      validInput(),
      jest.fn().mockResolvedValue('local-bcrypt-hash-placeholder'),
    );

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
    stdout.mockRestore();
    stderr.mockRestore();
  });
});
