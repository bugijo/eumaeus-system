import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const disconnectPrisma: () => Promise<void>;
export declare const connectPrisma: () => Promise<void>;
//# sourceMappingURL=prisma.d.ts.map