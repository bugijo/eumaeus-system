"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPrisma = exports.disconnectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const url = process.env.DATABASE_URL ?? '';
if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error('DATABASE_URL inválida/ausente em runtime; deve começar com postgres:// ou postgresql://');
}
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: ['warn', 'error']
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
const disconnectPrisma = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectPrisma = disconnectPrisma;
const connectPrisma = async () => {
    await exports.prisma.$connect();
};
exports.connectPrisma = connectPrisma;
//# sourceMappingURL=prisma.js.map