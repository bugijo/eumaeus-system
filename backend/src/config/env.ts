import dotenv from 'dotenv';
import {
  hasConfigurationPlaceholder,
  validateRequiredRuntimeEnvironment,
} from './runtimeEnvironment';

dotenv.config();

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env) => {
  const { databaseUrl, jwtSecret, refreshTokenSecret } = validateRequiredRuntimeEnvironment(environment);

  const configuredEmailUser = environment.EMAIL_USER?.trim() || '';
  const configuredEmailPassword = environment.EMAIL_PASSWORD?.trim() || '';
  const hasUsableEmailCredentials = Boolean(
    configuredEmailUser &&
    configuredEmailPassword &&
    !hasConfigurationPlaceholder(configuredEmailUser) &&
    !hasConfigurationPlaceholder(configuredEmailPassword),
  );

  return {
    database: {
      url: databaseUrl as string,
    },
    email: {
      host: environment.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(environment.EMAIL_PORT || '587', 10),
      secure: environment.EMAIL_SECURE === 'true',
      user: hasUsableEmailCredentials ? configuredEmailUser : '',
      pass: hasUsableEmailCredentials ? configuredEmailPassword : '',
      from: environment.EMAIL_FROM?.trim() || (hasUsableEmailCredentials ? configuredEmailUser : ''),
    },
    app: {
      port: parseInt(environment.PORT || '3333', 10),
      env: environment.NODE_ENV || 'development',
    },
    jwt: {
      secret: jwtSecret as string,
      refreshSecret: refreshTokenSecret as string,
      accessExpiresIn: '15m' as const,
      refreshExpiresIn: '30d' as const,
    },
  };
};

export const config = loadConfig();
