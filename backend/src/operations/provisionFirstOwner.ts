import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';
import { validateRequiredRuntimeEnvironment } from '../config/runtimeEnvironment';

export const FIRST_OWNER_CONFIRMATION = 'CREATE_INITIAL_OWNER';
const FIRST_OWNER_LOCK_ID = 1_732_806_117;
const OWNER_ROLE = 'DONO';

export type FirstOwnerInput = {
  email: string;
  name: string;
  password: string;
};

export class FirstOwnerProvisioningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirstOwnerProvisioningError';
  }
}

const requiredValue = (
  name: string,
  environment: NodeJS.ProcessEnv,
): string => {
  const value = environment[name];

  if (!value || value.trim() !== value) {
    throw new FirstOwnerProvisioningError(`${name} é obrigatória e não pode conter espaços externos`);
  }

  return value;
};

const validatePassword = (password: string, email: string): void => {
  const byteLength = Buffer.byteLength(password, 'utf8');
  const emailIdentity = email.split('@', 1)[0]?.toLowerCase() || '';
  const trivialPattern = /(?:password|senha|eumaeus|admin|qwerty|123456)/i;

  if (byteLength < 16 || byteLength > 72) {
    throw new FirstOwnerProvisioningError(
      'INITIAL_OWNER_PASSWORD deve possuir entre 16 e 72 bytes UTF-8',
    );
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password) ||
    trivialPattern.test(password) ||
    (emailIdentity.length >= 3 && password.toLowerCase().includes(emailIdentity))
  ) {
    throw new FirstOwnerProvisioningError(
      'INITIAL_OWNER_PASSWORD não atende à política de complexidade',
    );
  }
};

export const loadFirstOwnerInput = (
  environment: NodeJS.ProcessEnv = process.env,
): FirstOwnerInput => {
  validateRequiredRuntimeEnvironment(environment);

  const nodeEnvironment = requiredValue('NODE_ENV', environment).toLowerCase();
  if (!new Set(['production', 'test']).has(nodeEnvironment)) {
    throw new FirstOwnerProvisioningError('NODE_ENV deve ser production; test é aceito apenas pela automação isolada');
  }

  if (requiredValue('PROVISION_FIRST_OWNER_CONFIRMATION', environment) !== FIRST_OWNER_CONFIRMATION) {
    throw new FirstOwnerProvisioningError(
      `PROVISION_FIRST_OWNER_CONFIRMATION deve ser exatamente ${FIRST_OWNER_CONFIRMATION}`,
    );
  }

  const name = requiredValue('INITIAL_OWNER_NAME', environment);
  const email = requiredValue('INITIAL_OWNER_EMAIL', environment).toLowerCase();
  const password = requiredValue('INITIAL_OWNER_PASSWORD', environment);

  delete environment.INITIAL_OWNER_PASSWORD;

  if (name.length < 2 || name.length > 120 || /[\r\n\0]/.test(name)) {
    throw new FirstOwnerProvisioningError('INITIAL_OWNER_NAME deve possuir entre 2 e 120 caracteres válidos');
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[\r\n\0]/.test(email)
  ) {
    throw new FirstOwnerProvisioningError('INITIAL_OWNER_EMAIL deve ser um endereço válido');
  }

  validatePassword(password, email);

  return { email, name, password };
};

type PasswordHasher = (password: string, rounds: number) => Promise<string>;

export const provisionFirstOwner = async (
  client: PrismaClient,
  input: FirstOwnerInput,
  hashPassword: PasswordHasher = bcrypt.hash,
): Promise<void> => {
  const passwordHash = await hashPassword(input.password, 12);

  await client.$transaction(async (transaction) => {
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(${FIRST_OWNER_LOCK_ID}) IS NULL AS "lockAcquired"
    `;

    const [
      userCount,
      authProfileCount,
      ownerCount,
      tutorCount,
      petCount,
      appointmentCount,
      medicalRecordCount,
      medicalRecordProductCount,
      productCount,
      serviceCount,
      invoiceCount,
      invoiceItemCount,
      clinicSettingsCount,
    ] = await Promise.all([
      transaction.user.count(),
      transaction.authProfile.count(),
      transaction.user.count({ where: { roleName: OWNER_ROLE } }),
      transaction.tutor.count(),
      transaction.pet.count(),
      transaction.appointment.count(),
      transaction.medicalRecord.count(),
      transaction.medicalRecordProduct.count(),
      transaction.product.count(),
      transaction.service.count(),
      transaction.invoice.count(),
      transaction.invoiceItem.count(),
      transaction.clinicSettings.count(),
    ]);

    if (ownerCount > 0) {
      throw new FirstOwnerProvisioningError('Provisionamento recusado: já existe uma conta DONO');
    }

    const unexpectedDataCount = [
      userCount,
      authProfileCount,
      tutorCount,
      petCount,
      appointmentCount,
      medicalRecordCount,
      medicalRecordProductCount,
      productCount,
      serviceCount,
      invoiceCount,
      invoiceItemCount,
      clinicSettingsCount,
    ].reduce((total, count) => total + count, 0);

    if (unexpectedDataCount > 0) {
      throw new FirstOwnerProvisioningError(
        'Provisionamento recusado: o banco novo já contém contas ou dados inesperados',
      );
    }

    const existingIdentity = await transaction.authProfile.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingIdentity) {
      throw new FirstOwnerProvisioningError('Provisionamento recusado: identidade já cadastrada');
    }

    await transaction.role.upsert({
      where: { name: OWNER_ROLE },
      update: {},
      create: {
        name: OWNER_ROLE,
        description: 'Acesso total ao sistema.',
      },
    });

    const authProfile = await transaction.authProfile.create({
      data: {
        email: input.email,
        password: passwordHash,
        refreshToken: null,
      },
      select: { id: true },
    });

    await transaction.user.create({
      data: {
        name: input.name,
        roleName: OWNER_ROLE,
        clinicId: 1,
        authProfileId: authProfile.id,
      },
      select: { id: true },
    });
  }, {
    isolationLevel: 'Serializable',
  });
};
