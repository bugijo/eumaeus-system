import express, { Request, Response } from 'express';
import { accessGate } from './access/accessGate';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { billingService } from './services/billing.service';
import http from 'http';
import { config } from './config/env';
import { tutorRoutes } from './routes/tutor.routes';
import { petRoutes } from './routes/pet.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { medicalRecordRoutes } from './routes/medicalRecordRoutes';
import productRoutes from './routes/product.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import invoiceRoutes from './routes/invoice.routes';
import availabilityRoutes from './routes/availability.routes';
import serviceRoutes from './routes/service.routes';
import communicationRoutes from './routes/communication.routes';
import packageRoutes from './routes/package.routes';
import inventoryRoutes from './routes/inventory.routes';
import vaccinationRoutes from './routes/vaccination.routes';
import prescriptionRoutes from './routes/prescription.routes';
import financialRoutes from './routes/financial.routes';
import saleRoutes from './routes/sale.routes';
import helpRoutes from './routes/help.routes';
import cashRoutes from './routes/cash.routes';
import userRoutes from './routes/user.routes';
import specialistRoutes from './routes/specialist.routes';
import clinicSettingsRoutes from './routes/clinicSettings.routes';
import careRoutes from './routes/care.routes';
import { createSignupRouter, createMercadoPagoWebhookRouter } from './routes/signup.routes';
import createWhatsAppWebhookRouter from './routes/whatsappWebhook.routes';
import { loadWhatsAppLocalConfig } from './integrations/whatsapp/config';
import { whatsappPrismaStore } from './integrations/whatsapp/prisma.store';
import { reminderService } from './services/reminderService';
import { disconnectPrisma, prisma } from './lib/prisma';
import { runWithClinic } from './tenantContext';

const isTestEnv = config.app.env === 'test';
const HOST = '0.0.0.0';
export const DATABASE_READINESS_ERROR = 'Banco de dados indisponível ou schema não migrado.';

export const app = express();
// Confia só em proxies da rede local/privada (o Caddy na rede do compose). Com "true", qualquer cliente
// escolhia o próprio IP pelo X-Forwarded-For. TRUST_PROXY aceita o formato do Express (ex.: 1, true, lista).
const parseTrustProxy = (raw: string | undefined): boolean | number | string => {
  const value = (raw || '').trim();
  if (!value) return 'loopback, linklocal, uniquelocal';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
// Prisma Decimal serializa como string por padrão. O frontend existente espera
// números para formatar preços com toFixed; como os campos já têm escala fixa
// de centavos, esta conversão mantém o contrato sem reintroduzir Float no banco.
app.set('json replacer', function (this: Record<string, unknown>, key: string, value: unknown) {
  const original = this[key] as { constructor?: { name?: string }; toString?: () => string } | undefined;
  if (original?.constructor?.name === 'Decimal' && typeof original.toString === 'function') {
    return Number(original.toString());
  }
  return value;
});
app.use(compression());

app.use((req, res, next) => {
  const isApiResponse = req.path === '/api' || req.path.startsWith('/api/');
  const isHealthResponse = req.path === '/health';
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|ico|svg)$/.test(req.path);

  if (isApiResponse || isHealthResponse) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (isStaticAsset) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return next();
});

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || 180);
const RATE_LIMIT_API_MAX = Number(process.env.RATE_LIMIT_API_MAX_REQUESTS || 400);
const RATE_LIMIT_PUBLIC_MAX = Number(process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS || 300);

/**
 * Chave do limitador: identidade de token VERIFICADO (assinatura HS256) ou o IP resolvido pelo Express
 * (req.ip, que respeita "trust proxy"). Antes, qualquer Bearer não verificado ou o primeiro X-Forwarded-For
 * virava chave, e trocar o cabeçalho a cada tentativa dava um balde novo (login sem limite).
 * Em /api/auth a chave é sempre o IP: o login não pode depender de um cabeçalho do próprio cliente.
 */
export const getClientKey = (req: express.Request) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (req.path.toLowerCase().startsWith('/api/auth')) return `ip:${ip}`;
  const [scheme, token] = (req.headers.authorization || '').trim().split(/\s+/);
  if (scheme?.toLowerCase() === 'bearer' && token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
      if (decoded && typeof decoded === 'object' && (decoded as any).id !== undefined) {
        const subject = decoded as { id: unknown; type?: unknown; clinicId?: unknown };
        return `${String(subject.type || 'user')}:${String(subject.clinicId ?? '-')}:${String(subject.id)}`;
      }
    } catch { /* token inválido ou expirado: cai no IP */ }
  }
  return `ip:${ip}`;
};

app.use((req, res, next) => {
  const now = Date.now();
  const key = getClientKey(req);
  const lowerPath = req.path.toLowerCase();
  const maxRequests = lowerPath.startsWith('/api/auth')
    ? RATE_LIMIT_AUTH_MAX
    : lowerPath.startsWith('/api/')
      ? RATE_LIMIT_API_MAX
      : RATE_LIMIT_PUBLIC_MAX;

  if (Math.random() < 0.02) {
    for (const [storedKey, entry] of requestCounts.entries()) {
      if (now > entry.resetTime) {
        requestCounts.delete(storedKey);
      }
    }
  }

  const entry = requestCounts.get(key);
  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ error: 'Too many requests' });
  }

  return next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'https://eumaeus-system.vercel.app',
  'https://eumaeus-system-git-main-giovanni-pereiras-projects.vercel.app',
  'https://eumaeus.com.br',
  'https://www.eumaeus.com.br',
];

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

const whatsappChannels = (() => {
  try {
    return loadWhatsAppLocalConfig().channels ?? {};
  } catch {
    return {};
  }
})();

// Must precede express.json(): Meta signs the original request bytes.
app.use('/webhooks/whatsapp', createWhatsAppWebhookRouter({ channels: whatsappChannels, store: whatsappPrismaStore }));
// XML de NF-e com muitos itens passa de 100 KB (limite padrão); só estas rotas aceitam até 4 MB.
app.use('/api/inventory/nfe', express.json({ limit: '4mb' }));
app.use(express.json());

type CheckStatus = 'ok' | 'error';

const buildHealthPayload = (
  applicationStatus: CheckStatus,
  databaseStatus: CheckStatus,
) => ({
  status: applicationStatus === 'ok' && databaseStatus === 'ok' ? 'ok' as const : 'error' as const,
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  checks: {
    application: { status: applicationStatus },
    database: { status: databaseStatus },
  },
});

const checkDatabaseConnection = async () => {
  await prisma.$queryRaw`SELECT 1`;
};

const checkApplicationSchema = async () => {
  await prisma.$queryRaw`SELECT 1 FROM "public"."AuthProfile" LIMIT 1`;
};

export const checkDatabase = async () => {
  await checkDatabaseConnection();
  await checkApplicationSchema();
};

const healthHandler = async (_req: Request, res: Response) => {
  try {
    await checkDatabaseConnection();
  } catch {
    return res.status(503).json(buildHealthPayload('error', 'error'));
  }

  try {
    await checkApplicationSchema();
    return res.status(200).json(buildHealthPayload('ok', 'ok'));
  } catch {
    return res.status(503).json(buildHealthPayload('error', 'ok'));
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.get('/', (_req, res) => {
  res.json({ message: 'Eumaeus API está funcionando.' });
});

app.use('/api', accessGate);
app.use('/api/auth', authRoutes);
app.use('/api', tutorRoutes);
app.use('/api', petRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api', communicationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api', prescriptionRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/users', userRoutes);
app.use('/api/specialists', specialistRoutes);
app.use('/api/settings', clinicSettingsRoutes);
app.use('/api/care', careRoutes);
app.use('/api/signup', createSignupRouter());
app.use('/webhooks/mercadopago', createMercadoPagoWebhookRouter());

let server: http.Server | undefined;
let scheduledTasks: Array<ReturnType<typeof cron.schedule>> = [];

const scheduleReminderJobs = () => {
  const runForEachClinic = async <T>(job: () => Promise<T>): Promise<T[]> => {
    const clinics = await prisma.$queryRaw<Array<{ clinicId: number }>>`
      SELECT DISTINCT "clinicId" FROM "User" WHERE "clinicId" IS NOT NULL ORDER BY "clinicId"
    `;
    return Promise.all(clinics.map(({ clinicId }) => runWithClinic(clinicId, job)));
  };

  const heartbeat = cron.schedule('* * * * *', () => {
    console.log('[Eumaeus] Sistema de automação ativo.', new Date().toISOString());
  });

  const reminderDispatch = cron.schedule('0 8 * * *', async () => {
    try {
      const results = await runForEachClinic(() => reminderService.sendAllReminders());
      const sent = results.reduce((total, result) => total + result.appointments.sent + result.vaccines.sent, 0);
      const failed = results.reduce((total, result) => total + result.appointments.failed + result.vaccines.failed, 0);
      console.log(`[Eumaeus] Lembretes concluídos: enviados=${sent}, falhas=${failed}.`);
    } catch {
      console.error('[Eumaeus] Falha no envio agendado de lembretes.');
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  const reminderCheck = cron.schedule('55 7 * * *', async () => {
    try {
      await runForEachClinic(() => reminderService.testReminderSystem());
    } catch {
      console.error('[Eumaeus] Falha no teste agendado do sistema de lembretes.');
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  // Assinaturas: passa ao preço cheio quem já teve as 3 cobranças promocionais.
  const subscriptionPrices = cron.schedule('0 6 * * *', async () => {
    try {
      const result = await billingService.raiseDuePrices();
      if (result.due) console.log(`[Eumaeus] Assinaturas no preço cheio: ${result.raised}/${result.due}.`);
    } catch {
      console.error('[Eumaeus] Falha na troca de preço das assinaturas.');
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  scheduledTasks = [heartbeat, reminderDispatch, reminderCheck, subscriptionPrices];
};

interface StartServerOptions {
  host?: string;
  port?: number;
  scheduleJobs?: boolean;
}

export const startServer = async ({
  host = HOST,
  port = config.app.port,
  scheduleJobs = !isTestEnv,
}: StartServerOptions = {}): Promise<http.Server> => {
  if (server) {
    return server;
  }

  try {
    await checkDatabase();
  } catch {
    throw new Error(DATABASE_READINESS_ERROR);
  }

  server = await new Promise<http.Server>((resolve, reject) => {
    const candidate = app.listen(port, host);

    const handleStartupError = (error: Error) => {
      candidate.removeListener('listening', handleListening);
      reject(error);
    };

    const handleListening = () => {
      candidate.removeListener('error', handleStartupError);
      resolve(candidate);
    };

    candidate.once('error', handleStartupError);
    candidate.once('listening', handleListening);
  });

  server.on('error', () => {
    console.error('[Eumaeus] Erro no servidor HTTP.');
  });

  if (scheduleJobs) {
    scheduleReminderJobs();
  }

  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;
  console.log(`[Eumaeus] Backend disponível em http://${host}:${boundPort}.`);
  return server;
};

export const stopServer = async (): Promise<void> => {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];

  if (server) {
    const activeServer = server;
    server = undefined;
    await new Promise<void>((resolve, reject) => {
      activeServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  await disconnectPrisma();
};

export { server };
export default app;
