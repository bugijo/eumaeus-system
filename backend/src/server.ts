import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cron from 'node-cron';
import http from 'http';
import bcrypt from 'bcrypt';
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
import { prisma } from './lib/prisma';

const isTestEnv = process.env.NODE_ENV === 'test';
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@eumaeus.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
const DEFAULT_VET_EMAIL = process.env.DEFAULT_VET_EMAIL || 'veterinario@eumaeus.com';
const DEFAULT_VET_PASSWORD = process.env.DEFAULT_VET_PASSWORD || '123456';
const DEFAULT_RECEPTION_EMAIL = process.env.DEFAULT_RECEPTION_EMAIL || 'recepcao@eumaeus.com';
const DEFAULT_RECEPTION_PASSWORD = process.env.DEFAULT_RECEPTION_PASSWORD || '123456';
const DEFAULT_ASSISTANT_EMAIL = process.env.DEFAULT_ASSISTANT_EMAIL || 'auxiliar@eumaeus.com';
const DEFAULT_ASSISTANT_PASSWORD = process.env.DEFAULT_ASSISTANT_PASSWORD || '123456';

export const app = express();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0'; // Aceitar conexÃµes de qualquer endereÃ§o na rede
app.set('trust proxy', true);

// Middleware de compressÃ£o simplificado
app.use(compression());

// Middleware de cache headers
app.use((req, res, next) => {
  // Cache para recursos estÃ¡ticos
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
  }
  // Cache para APIs de dashboard (5 minutos)
  else if (req.url.includes('/api/dashboard')) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
  }
  // Cache para outras APIs (1 minuto)
  else if (req.url.includes('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minuto
  }
  // Headers de seguranÃ§a
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  return next();
});

// Middleware de rate limiting (por token/IP) com limites configuráveis
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

// ConfiguraÃ§Ã£o de CORS com origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'https://eumaeus-system.vercel.app',
  'https://eumaeus-system-git-main-giovanni-pereiras-projects.vercel.app',
  'https://eumaeus.com.br',
  'https://www.eumaeus.com.br'
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

// Middlewares
app.use(express.json());

// Rotas
app.use('/api', tutorRoutes);
app.use('/api', petRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);

app.use('/api/availability', availabilityRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api', prescriptionRoutes);
app.use('/api/settings', clinicSettingsRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'VetSystem API estÃ¡ funcionando!' });
});

const buildHealthPayload = (status: 'ok' | 'error') => ({
  status,
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});

// Endpoint de saÃºde (Ãºtil p/ frontend)
app.get('/health', async (_req, res) => {
  const payload = buildHealthPayload('ok');

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(payload);
  } catch (e) {
    const errorPayload = { ...payload, status: 'error' as const };
    res.status(503).json(errorPayload);
  }
});

app.get('/api/health', async (_req, res) => {
  const payload = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(payload);
  } catch (error) {
    res.status(503).json({ ...payload, status: 'error' as const });
  }
});

if (!isTestEnv) {
  // ConfiguraÃ§Ã£o do Sistema de Lembretes AutomÃ¡ticos
  // ================================================

  // PROVA DE VIDA: Cron job de teste que roda a cada minuto
  cron.schedule('* * * * *', () => {
    console.log('â° CRON JOB RODANDO! O sistema de automaÃ§Ã£o estÃ¡ vivo. - ', new Date().toLocaleString());
    // No futuro, aqui chamaremos as funÃ§Ãµes do ReminderService
  });

  // Cron job principal: Envia lembretes todos os dias Ã s 8:00 da manhÃ£
  // Formato: '0 8 * * *' = minuto 0, hora 8, todos os dias
  cron.schedule('0 8 * * *', async () => {
    console.log('ðŸŒ… Iniciando envio de lembretes automÃ¡ticos das 8:00...');
    try {
      const results = await reminderService.sendAllReminders();
      console.log('âœ… Lembretes automÃ¡ticos enviados com sucesso!');
      console.log(`ðŸ“Š Resumo: ${results.appointments.sent + results.vaccines.sent} enviados, ${results.appointments.failed + results.vaccines.failed} falharam`);
    } catch (error) {
      console.error('âŒ Erro no envio de lembretes automÃ¡ticos:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Cron job de teste do sistema: Testa o sistema Ã s 7:55 (5 minutos antes do envio real)
  cron.schedule('55 7 * * *', async () => {
    console.log('ðŸ§ª Executando teste do sistema de lembretes...');
    try {
      await reminderService.testReminderSystem();
    } catch (error) {
      console.error('âŒ Erro no teste do sistema de lembretes:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });
}

let server: http.Server | undefined;

const DEFAULT_STAFF_USERS: Array<{ name: string; email: string; password: string; roleName: string }> = [
  { name: 'Administrador', email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD, roleName: 'DONO' },
  { name: 'Dra. Maria Silva', email: DEFAULT_VET_EMAIL, password: DEFAULT_VET_PASSWORD, roleName: 'VETERINARIO' },
  { name: 'Joao da Recepcao', email: DEFAULT_RECEPTION_EMAIL, password: DEFAULT_RECEPTION_PASSWORD, roleName: 'RECEPCAO' },
  { name: 'Ana Auxiliar', email: DEFAULT_ASSISTANT_EMAIL, password: DEFAULT_ASSISTANT_PASSWORD, roleName: 'AUXILIAR' },
];

const ensureDefaultStaffUsers = async () => {
  try {
    const defaultRoles = [
      { name: 'DONO', description: 'Acesso total ao sistema.' },
      { name: 'VETERINARIO', description: 'Acesso clinico e gerencial completo.' },
      { name: 'RECEPCAO', description: 'Acesso a agenda e cadastros.' },
      { name: 'AUXILIAR', description: 'Acesso operacional limitado.' },
      { name: 'FINANCEIRO', description: 'Acesso financeiro.' },
      { name: 'FUNCIONARIO', description: 'Perfil legado.' },
    ];

    for (const role of defaultRoles) {
      await prisma.role.upsert({
        where: { name: role.name as any },
        update: { description: role.description },
        create: role as any,
      });
    }

    for (const staff of DEFAULT_STAFF_USERS) {
      const existingAuthProfile = await prisma.authProfile.findUnique({
        where: { email: staff.email },
        include: { user: true },
      });

      let authProfileId = existingAuthProfile?.id;
      if (!existingAuthProfile) {
        const hashedPassword = await bcrypt.hash(staff.password, 10);
        const createdAuthProfile = await prisma.authProfile.create({
          data: {
            email: staff.email,
            password: hashedPassword,
          },
        });
        authProfileId = createdAuthProfile.id;
      }

      if (authProfileId && !existingAuthProfile?.user) {
        await prisma.user.create({
          data: {
            name: staff.name,
            roleName: staff.roleName as any,
            authProfileId,
          },
        });
      }
    }

    const productCount = await prisma.product.count();
    if (productCount === 0) {
      await prisma.product.createMany({
        data: [
          {
            name: 'Vacina V10',
            description: JSON.stringify({ supplier: 'Laboratorio VetMed', expirationDate: '2027-12-31' }),
            quantity: 120,
            price: 90,
            category: 'Vacina',
          },
          {
            name: 'Vacina Antirrabica',
            description: JSON.stringify({ supplier: 'Laboratorio SaudePet', expirationDate: '2027-10-31' }),
            quantity: 90,
            price: 75,
            category: 'Vacina',
          },
          {
            name: 'Anti-inflamatorio',
            description: JSON.stringify({ supplier: 'Farmavet', expirationDate: '2027-09-15' }),
            quantity: 140,
            price: 42,
            category: 'Medicamento',
          },
        ],
      });
    }

    console.log('✅ Usuarios padrao por perfil garantidos com sucesso.');
  } catch (error) {
    console.error('⚠️ Falha ao garantir usuarios padrao por perfil:', error);
  }
};

if (!isTestEnv) {
  ensureDefaultStaffUsers();

  // Inicia o servidor
  server = app.listen(PORT, HOST, () => {
    console.log(`ðŸš€ Backend rodando e acessÃ­vel na rede em http://192.168.3.12:${PORT}`);
    console.log(`ðŸ“‹ API disponÃ­vel localmente em: http://localhost:${PORT}`);
    console.log(`ðŸŒ API disponÃ­vel na rede em: http://192.168.3.12:${PORT}`);
    console.log(`ðŸ‘¥ Endpoint de tutores: http://192.168.3.12:${PORT}/api/tutors`);
    console.log(`ðŸ¾ Endpoint de pets: http://192.168.3.12:${PORT}/api/pets`);
    console.log(`ðŸ“… Endpoint de agendamentos: http://192.168.3.12:${PORT}/api/appointments`);
    console.log(`ðŸ©º Endpoint de prontuÃ¡rios: http://192.168.3.12:${PORT}/api/records`);
    console.log(`ðŸ“¦ Endpoint de produtos: http://192.168.3.12:${PORT}/api/products`);
    console.log(`ðŸ” Endpoint de autenticaÃ§Ã£o: http://192.168.3.12:${PORT}/api/auth/login`);
    console.log(`ðŸ“Š Endpoint de dashboard: http://192.168.3.12:${PORT}/api/dashboard/stats`);
    console.log(`ðŸ’° Endpoint de faturas: http://192.168.3.12:${PORT}/api/invoices`);

    console.log(`â° Endpoint de disponibilidade: http://192.168.3.12:${PORT}/api/availability`);
    console.log(`ðŸ› ï¸ Endpoint de serviÃ§os: http://192.168.3.12:${PORT}/api/services`);
    console.log(`ðŸ’Š Endpoint de receitas: http://192.168.3.12:${PORT}/api/prescriptions`);
    console.log(`âš™ï¸ Endpoint de configuraÃ§Ãµes: http://192.168.3.12:${PORT}/api/settings/notifications`);

    // Mensagens do Sistema de AutomaÃ§Ã£o
    console.log('\nðŸ¤– ===== SISTEMA DE AUTOMAÃ‡ÃƒO ATIVADO =====');
    console.log('â° Cron job de teste: Rodando a cada minuto (prova de vida)');
    console.log('ðŸ§ª Teste do sistema: Todos os dias Ã s 7:55');
    console.log('ðŸ“§ Envio de lembretes: Todos os dias Ã s 8:00');
    console.log('ðŸŒŽ Timezone: America/Sao_Paulo');
    console.log('âœ¨ O Eumaeus agora Ã© um sistema PROATIVO!');
    console.log('==========================================\n');
  });

  server.on('error', (err) => {
    console.error('fatal', err);
    process.exit(1); // Encerra a aplicaÃ§Ã£o em caso de erro fatal no servidor
  });
}

export { server };
export default app;

