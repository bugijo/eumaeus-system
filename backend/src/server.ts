import express, { Request, Response } from 'express';
import compression from 'compression';
import cron from 'node-cron';
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
import prescriptionRoutes from './routes/prescription.routes';
import clinicSettingsRoutes from './routes/clinicSettings.routes';
import { reminderService } from './services/reminderService';
import { disconnectPrisma, prisma } from './lib/prisma';

const isTestEnv = config.app.env === 'test';
const HOST = '0.0.0.0';
export const DATABASE_READINESS_ERROR = 'Banco de dados indisponível ou schema não migrado.';

export const app = express();
app.set('trust proxy', true);
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

const getClientKey = (req: express.Request) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ') && authHeader.length > 30) {
    return `token:${authHeader.slice(-24)}`;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || '').split(',')[0].trim();
  const ip = forwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
};

app.use((req, res, next) => {
  const now = Date.now();
  const key = getClientKey(req);
  const maxRequests = req.url.includes('/api/auth')
    ? RATE_LIMIT_AUTH_MAX
    : req.url.includes('/api/')
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
app.use('/api', prescriptionRoutes);
app.use('/api/settings', clinicSettingsRoutes);

let server: http.Server | undefined;
let scheduledTasks: Array<ReturnType<typeof cron.schedule>> = [];

const scheduleReminderJobs = () => {
  const heartbeat = cron.schedule('* * * * *', () => {
    console.log('[Eumaeus] Sistema de automação ativo.', new Date().toISOString());
  });

  const reminderDispatch = cron.schedule('0 8 * * *', async () => {
    try {
      const results = await reminderService.sendAllReminders();
      const sent = results.appointments.sent + results.vaccines.sent;
      const failed = results.appointments.failed + results.vaccines.failed;
      console.log(`[Eumaeus] Lembretes concluídos: enviados=${sent}, falhas=${failed}.`);
    } catch {
      console.error('[Eumaeus] Falha no envio agendado de lembretes.');
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  const reminderCheck = cron.schedule('55 7 * * *', async () => {
    try {
      await reminderService.testReminderSystem();
    } catch {
      console.error('[Eumaeus] Falha no teste agendado do sistema de lembretes.');
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  scheduledTasks = [heartbeat, reminderDispatch, reminderCheck];
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
