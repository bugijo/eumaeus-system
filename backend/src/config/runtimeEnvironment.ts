const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
] as const;

type RequiredVariable = (typeof REQUIRED_VARIABLES)[number];

export const hasConfigurationPlaceholder = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  return (
    /(?:^|[^a-z])(your|seu|sua)(?:[^a-z]|$)/.test(normalized) ||
    /(change|replace)[-_ ]?me/.test(normalized) ||
    /replace[-_ ]?with/.test(normalized) ||
    /(placeholder|example|exemplo|segredo|super[-_ ]?secret|123456)/.test(normalized) ||
    /[<>\[\]]/.test(normalized)
  );
};

const isValidPostgresUrl = (value: string | undefined): value is string => {
  if (!value || value.trim() !== value || hasConfigurationPlaceholder(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const isPostgresProtocol = parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
    const hasDatabaseName = parsed.pathname.replace(/^\/+/, '').length > 0;

    return isPostgresProtocol && Boolean(parsed.hostname) && hasDatabaseName;
  } catch {
    return false;
  }
};

const isValidSecret = (value: string | undefined): value is string => {
  if (!value || value.trim() !== value || value.length < 32 || hasConfigurationPlaceholder(value)) {
    return false;
  }

  return new Set(value).size >= 8;
};

export const validateRequiredRuntimeEnvironment = (
  environment: NodeJS.ProcessEnv,
): {
  databaseUrl: string;
  jwtSecret: string;
  refreshTokenSecret: string;
} => {
  const invalidVariables = new Set<RequiredVariable>();
  const databaseUrl = environment.DATABASE_URL;
  const jwtSecret = environment.JWT_SECRET;
  const refreshTokenSecret = environment.REFRESH_TOKEN_SECRET;

  if (!isValidPostgresUrl(databaseUrl)) {
    invalidVariables.add('DATABASE_URL');
  }

  if (!isValidSecret(jwtSecret)) {
    invalidVariables.add('JWT_SECRET');
  }

  if (!isValidSecret(refreshTokenSecret)) {
    invalidVariables.add('REFRESH_TOKEN_SECRET');
  }

  if (jwtSecret && refreshTokenSecret && jwtSecret === refreshTokenSecret) {
    invalidVariables.add('JWT_SECRET');
    invalidVariables.add('REFRESH_TOKEN_SECRET');
  }

  if (invalidVariables.size > 0) {
    const orderedInvalidVariables = REQUIRED_VARIABLES.filter((name) => invalidVariables.has(name));
    throw new Error(orderedInvalidVariables.join(', '));
  }

  return {
    databaseUrl: databaseUrl as string,
    jwtSecret: jwtSecret as string,
    refreshTokenSecret: refreshTokenSecret as string,
  };
};
