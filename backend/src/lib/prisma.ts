import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: config.app.env === 'development' ? ['warn', 'error'] : [],
  });

export const prisma = globalForPrisma.prisma ?? createClient();

if (config.app.env !== 'test') {
  globalForPrisma.prisma = prisma;
}

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

export const connectPrisma = async () => {
  await prisma.$connect();
};
