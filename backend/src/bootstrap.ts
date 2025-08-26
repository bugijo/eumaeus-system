import { execSync } from "child_process";

try {
  if (process.env.NODE_ENV === "production") {
    console.log("[PulseVet] Forcing prisma generate on startup...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("[PulseVet] Prisma generate completed.");
  }
} catch (error) {
  console.error("[PulseVet] CRITICAL: prisma generate failed.", error);
  throw error; // lançar e deixar o topo decidir encerrar o processo
}

// Inicia o servidor real após garantir o client Prisma
import { bootstrap } from "./server";

bootstrap().catch((err) => {
  console.error("[PulseVet] Failed to start server:", err);
  process.exit(1);
});