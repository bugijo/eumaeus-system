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

export const app = express();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0'; // Aceitar conexões de qualquer endereço na rede

// Middleware de compressão simplificado
app.use(compression());

// Middleware de cache headers
app.use((req, res, next) => {
  // Cache para recursos estáticos
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
  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  return next();
});

// Middleware de rate limiting simples
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 100; // 100 requests por minuto
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const record = requestCounts.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
      }
    }
  }
  return next();
});

// Configuração de CORS com origens permitidas
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
  res.json({ message: 'VetSystem API está funcionando!' });
});

const buildHealthPayload = (status: 'ok' | 'error') => ({
  status,
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});

// Endpoint de saúde (útil p/ frontend)
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
  // Configuração do Sistema de Lembretes Automáticos
  // ================================================

  // PROVA DE VIDA: Cron job de teste que roda a cada minuto
  cron.schedule('* * * * *', () => {
    console.log('⏰ CRON JOB RODANDO! O sistema de automação está vivo. - ', new Date().toLocaleString());
    // No futuro, aqui chamaremos as funções do ReminderService
  });

  // Cron job principal: Envia lembretes todos os dias às 8:00 da manhã
  // Formato: '0 8 * * *' = minuto 0, hora 8, todos os dias
  cron.schedule('0 8 * * *', async () => {
    console.log('🌅 Iniciando envio de lembretes automáticos das 8:00...');
    try {
      const results = await reminderService.sendAllReminders();
      console.log('✅ Lembretes automáticos enviados com sucesso!');
      console.log(`📊 Resumo: ${results.appointments.sent + results.vaccines.sent} enviados, ${results.appointments.failed + results.vaccines.failed} falharam`);
    } catch (error) {
      console.error('❌ Erro no envio de lembretes automáticos:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // Cron job de teste do sistema: Testa o sistema às 7:55 (5 minutos antes do envio real)
  cron.schedule('55 7 * * *', async () => {
    console.log('🧪 Executando teste do sistema de lembretes...');
    try {
      await reminderService.testReminderSystem();
    } catch (error) {
      console.error('❌ Erro no teste do sistema de lembretes:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });
}

let server: http.Server | undefined;

const ensureDefaultAdminUser = async () => {
  try {
    await prisma.role.upsert({
      where: { name: 'DONO' as any },
      update: {},
      create: {
        name: 'DONO' as any,
        description: 'Acesso total ao sistema.',
      },
    });

    const existingAuthProfile = await prisma.authProfile.findUnique({
      where: { email: DEFAULT_ADMIN_EMAIL },
    });

    if (existingAuthProfile) {
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    const authProfile = await prisma.authProfile.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Administrador',
        roleName: 'DONO' as any,
        authProfileId: authProfile.id,
      },
    });

    console.log(`✅ Usuário admin padrão criado: ${DEFAULT_ADMIN_EMAIL}`);
  } catch (error) {
    console.error('⚠️ Falha ao garantir usuário admin padrão:', error);
  }
};

if (!isTestEnv) {
  ensureDefaultAdminUser();

  // Inicia o servidor
  server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Backend rodando e acessível na rede em http://192.168.3.12:${PORT}`);
    console.log(`📋 API disponível localmente em: http://localhost:${PORT}`);
    console.log(`🌐 API disponível na rede em: http://192.168.3.12:${PORT}`);
    console.log(`👥 Endpoint de tutores: http://192.168.3.12:${PORT}/api/tutors`);
    console.log(`🐾 Endpoint de pets: http://192.168.3.12:${PORT}/api/pets`);
    console.log(`📅 Endpoint de agendamentos: http://192.168.3.12:${PORT}/api/appointments`);
    console.log(`🩺 Endpoint de prontuários: http://192.168.3.12:${PORT}/api/records`);
    console.log(`📦 Endpoint de produtos: http://192.168.3.12:${PORT}/api/products`);
    console.log(`🔐 Endpoint de autenticação: http://192.168.3.12:${PORT}/api/auth/login`);
    console.log(`📊 Endpoint de dashboard: http://192.168.3.12:${PORT}/api/dashboard/stats`);
    console.log(`💰 Endpoint de faturas: http://192.168.3.12:${PORT}/api/invoices`);

    console.log(`⏰ Endpoint de disponibilidade: http://192.168.3.12:${PORT}/api/availability`);
    console.log(`🛠️ Endpoint de serviços: http://192.168.3.12:${PORT}/api/services`);
    console.log(`💊 Endpoint de receitas: http://192.168.3.12:${PORT}/api/prescriptions`);
    console.log(`⚙️ Endpoint de configurações: http://192.168.3.12:${PORT}/api/settings/notifications`);

    // Mensagens do Sistema de Automação
    console.log('\n🤖 ===== SISTEMA DE AUTOMAÇÃO ATIVADO =====');
    console.log('⏰ Cron job de teste: Rodando a cada minuto (prova de vida)');
    console.log('🧪 Teste do sistema: Todos os dias às 7:55');
    console.log('📧 Envio de lembretes: Todos os dias às 8:00');
    console.log('🌎 Timezone: America/Sao_Paulo');
    console.log('✨ O Eumaeus agora é um sistema PROATIVO!');
    console.log('==========================================\n');
  });

  server.on('error', (err) => {
    console.error('fatal', err);
    process.exit(1); // Encerra a aplicação em caso de erro fatal no servidor
  });
}

export { server };
export default app;
