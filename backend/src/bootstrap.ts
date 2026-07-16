import 'dotenv/config';

console.log('[Eumaeus] Iniciando servidor...');

const bootstrap = async () => {
  try {
    const { startServer, stopServer } = await import('./server');
    await startServer();

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      console.log(`[Eumaeus] Encerrando após ${signal}...`);

      try {
        await stopServer();
      } catch {
        console.error('[Eumaeus] Falha durante o encerramento.');
        process.exitCode = 1;
      }
    };

    process.once('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
    process.once('SIGINT', () => {
      void shutdown('SIGINT');
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'erro desconhecido';
    console.error(`[Eumaeus] Falha na inicialização: ${reason}`);
    process.exitCode = 1;
  }
};

void bootstrap();
