import { logNfeError, sanitizeAxiosError } from '../services/nfe.service';

describe('NFS-e error log safety', () => {
  it('does not retain authorization headers, response bodies, URLs, or tokens', () => {
    const secretMarker = 'synthetic-focus-token-never-log';
    const error = {
      isAxiosError: true,
      code: 'ERR_TEST',
      config: {
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretMarker}:`).toString('base64')}`,
        },
        url: `https://example.invalid/nfse?token=${secretMarker}`,
      },
      response: {
        data: { token: secretMarker },
        status: 502,
      },
    };

    const safeLog = JSON.stringify(sanitizeAxiosError(error));

    expect(safeLog).toContain('ERR_TEST');
    expect(safeLog).toContain('502');
    expect(safeLog).not.toContain(secretMarker);
    expect(safeLog).not.toContain('Authorization');
    expect(safeLog).not.toContain('example.invalid');

    const logger = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logNfeError('external request failed', error, { operation: 'test' });
    const loggedValue = JSON.stringify(logger.mock.calls);

    expect(loggedValue).not.toContain(secretMarker);
    expect(loggedValue).not.toContain('Authorization');
    expect(loggedValue).not.toContain('example.invalid');
    logger.mockRestore();
  });
});
