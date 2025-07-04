"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPrisma = exports.disconnectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
const disconnectPrisma = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectPrisma = disconnectPrisma;
const connectPrisma = async () => {
    await exports.prisma.$connect();
};
exports.connectPrisma = connectPrisma;
//# sourceMappingURL=prisma.js.map