"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
try {
    if (process.env.NODE_ENV === "production") {
        console.log("[PulseVet] Forcing prisma generate on startup...");
        (0, child_process_1.execSync)("npx prisma generate", { stdio: "inherit" });
        console.log("[PulseVet] Prisma generate completed.");
    }
}
catch (error) {
    console.error("[PulseVet] CRITICAL: prisma generate failed.", error);
    throw error;
}
const server_1 = require("./server");
(0, server_1.bootstrap)().catch((err) => {
    console.error("[PulseVet] Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=bootstrap.js.map