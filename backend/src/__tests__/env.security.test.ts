import { loadConfig } from '../config/env';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test_user:local_password@localhost:5432/eumaeus_test',
  JWT_SECRET: 'local-access-material-A1b2C3d4E5f6G7h8',
  REFRESH_TOKEN_SECRET: 'local-refresh-material-Z9y8X7w6V5u4T3s2',
});

describe('environment security configuration', () => {
  it.each([
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
  ] as const)('fails with only the variable name when %s is absent', (variableName) => {
    const environment = validEnvironment();
    delete environment[variableName];

    expect(() => loadConfig(environment)).toThrow(new Error(variableName));
  });

  it.each([
    'file:./dev.db',
    'postgresql://db_user:replace-with-password@localhost:5432/eumaeus',
  ])('rejects non-PostgreSQL or placeholder database URLs', (databaseUrl) => {
    const environment = validEnvironment();
    environment.DATABASE_URL = databaseUrl;

    expect(() => loadConfig(environment)).toThrow(new Error('DATABASE_URL'));
  });

  it.each([
    'short',
    'your-placeholder-access-secret-with-more-than-32-characters',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ])('rejects weak or placeholder JWT secrets without echoing them', (invalidSecret) => {
    const environment = validEnvironment();
    environment.JWT_SECRET = invalidSecret;

    try {
      loadConfig(environment);
      throw new Error('expected loadConfig to reject the secret');
    } catch (error) {
      expect((error as Error).message).toBe('JWT_SECRET');
      expect((error as Error).message).not.toContain(invalidSecret);
    }
  });

  it('requires access and refresh secrets to be distinct', () => {
    const environment = validEnvironment();
    environment.REFRESH_TOKEN_SECRET = environment.JWT_SECRET;

    expect(() => loadConfig(environment)).toThrow(
      new Error('JWT_SECRET, REFRESH_TOKEN_SECRET'),
    );
  });

  it('returns validated PostgreSQL and JWT configuration', () => {
    const environment = validEnvironment();

    const loadedConfig = loadConfig(environment);

    expect(loadedConfig.database.url).toBe(environment.DATABASE_URL);
    expect(loadedConfig.jwt.secret).toBe(environment.JWT_SECRET);
    expect(loadedConfig.jwt.refreshSecret).toBe(environment.REFRESH_TOKEN_SECRET);
  });
});
