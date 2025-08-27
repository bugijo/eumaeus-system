import { execSync } from "child_process";

try {
  if (process.env.NODE_ENV === "production") {
    console.log("[Eumaeus] Forcing prisma generate on startup...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("[Eumaeus] Prisma generate completed.");
  }
} catch (error) {
  console.error("[Eumaeus] CRITICAL: prisma generate failed.", error);
  throw error; // lançar e deixar o topo decidir encerrar o processo
}

// Inicia o servidor real após garantir o client Prisma
import "./server";