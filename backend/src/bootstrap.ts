import { execSync } from "child_process";

try {
  if (process.env.NODE_ENV === "production") {
    console.log("[PulseVet] Forcing prisma generate on startup...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("[PulseVet] Prisma generate completed.");
  }
} catch (error) {
  console.error("[PulseVet] CRITICAL: prisma generate failed.", error);
  process.exit(1);
}

// Importa o servidor real após garantir o client
import("./server");