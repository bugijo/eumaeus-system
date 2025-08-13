import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL ?? '';

// Confirma que a URL tem o protocolo correto e existe
if (!/^postgres(ql)?:\/\//.test(url)) {
  throw new Error(
    'DATABASE_URL inválida/ausente em runtime; deve começar com postgres:// ou postgresql://'
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Função para desconectar do banco (útil para testes)
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// Função para conectar ao banco
export const connectPrisma = async () => {
  await prisma.$connect();
};