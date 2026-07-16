import { prisma } from '../lib/prisma';
import { DATABASE_READINESS_ERROR, startServer, stopServer } from '../server';

describe('server startup', () => {
  afterEach(async () => {
    await stopServer();
  });

  it('checks the database before listening without provisioning users or products', async () => {
    const queryRawMock = prisma.$queryRaw as jest.Mock;
    queryRawMock.mockResolvedValue([{ result: 1 }]);

    const server = await startServer({
      host: '127.0.0.1',
      port: 0,
      scheduleJobs: false,
    });

    expect(server.listening).toBe(true);
    expect(queryRawMock).toHaveBeenCalledTimes(2);
    expect(prisma.authProfile.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.product.createMany).not.toHaveBeenCalled();
  });

  it('does not listen when the initial database check fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('database unavailable'));

    await expect(startServer({
      host: '127.0.0.1',
      port: 0,
      scheduleJobs: false,
    })).rejects.toThrow(DATABASE_READINESS_ERROR);
  });

  it('does not listen when the database is reachable but the schema is absent', async () => {
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ result: 1 }])
      .mockRejectedValueOnce(new Error('schema unavailable'));

    await expect(startServer({
      host: '127.0.0.1',
      port: 0,
      scheduleJobs: false,
    })).rejects.toThrow(DATABASE_READINESS_ERROR);
  });
});
