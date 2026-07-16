import { assertMutationScriptAllowed, requireScriptSecret } from '../config/scriptSafety';

describe('mutation script safety', () => {
  it.each([undefined, '', 'production', ' Production ', 'staging']) (
    'fails closed for NODE_ENV=%p',
    (nodeEnvironment) => {
      expect(() => assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION', {
        NODE_ENV: nodeEnvironment,
        ALLOW_TEST_DATA_MUTATION: 'true',
      })).toThrow('NODE_ENV');
    },
  );

  it('requires an explicit mutation opt-in', () => {
    expect(() => assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION', {
      NODE_ENV: 'development',
    })).toThrow('ALLOW_TEST_DATA_MUTATION');
  });

  it.each(['development', 'test', ' TEST '])(
    'allows an explicit opt-in in %s',
    (nodeEnvironment) => {
      expect(() => assertMutationScriptAllowed('ALLOW_TEST_DATA_MUTATION', {
        NODE_ENV: nodeEnvironment,
        ALLOW_TEST_DATA_MUTATION: 'true',
      })).not.toThrow();
    },
  );

  it('requires an explicit non-trivial script password without exposing it', () => {
    const submittedValue = 'short';

    expect(() => requireScriptSecret('SEED_STAFF_PASSWORD', {
      SEED_STAFF_PASSWORD: submittedValue,
    })).toThrow('SEED_STAFF_PASSWORD');

    try {
      requireScriptSecret('SEED_STAFF_PASSWORD', { SEED_STAFF_PASSWORD: submittedValue });
    } catch (error) {
      expect(String(error)).not.toContain(submittedValue);
    }
  });
});
