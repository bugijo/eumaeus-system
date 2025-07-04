import { PrismaClient } from '@prisma/client';

// Instância global do Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Função para desconectar do banco (útil para testes)
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// Função para conectar ao banco
export const connectPrisma = async () => {
  await prisma.$connect();
};