import 'dotenv/config';
import {
  loadProductionVerificationOptions,
  verifyProductionReadiness,
} from '../operations/verifyProductionReadiness';

const main = async (): Promise<void> => {
  const options = loadProductionVerificationOptions(process.env);
  const { disconnectPrisma, prisma } = await import('../lib/prisma');

  try {
    const report = await verifyProductionReadiness(prisma, options);
    console.log(JSON.stringify(report));
  } finally {
    await disconnectPrisma().catch(() => undefined);
  }
};

void main()
  .catch(() => {
    console.error('[Eumaeus] Verificação de produção falhou sem expor dados ou credenciais.');
    process.exitCode = 1;
  });
