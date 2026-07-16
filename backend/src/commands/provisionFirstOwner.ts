import 'dotenv/config';
import {
  FirstOwnerProvisioningError,
  loadFirstOwnerInput,
  provisionFirstOwner,
} from '../operations/provisionFirstOwner';

const main = async (): Promise<void> => {
  const input = loadFirstOwnerInput(process.env);
  const { disconnectPrisma, prisma } = await import('../lib/prisma');

  try {
    await provisionFirstOwner(prisma, input);
    console.log('[Eumaeus] Conta DONO inicial criada com segurança.');
  } finally {
    await disconnectPrisma().catch(() => undefined);
  }
};

void main()
  .catch((error: unknown) => {
    if (error instanceof FirstOwnerProvisioningError) {
      console.error(`[Eumaeus] ${error.message}`);
    } else {
      console.error('[Eumaeus] Provisionamento falhou sem gravar detalhes sensíveis no log.');
    }
    process.exitCode = 1;
  });
