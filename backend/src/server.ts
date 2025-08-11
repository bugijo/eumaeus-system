import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
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

// Carrega variáveis de ambiente
dotenv.config();
console.log('--- VETDEV DEBUG --- DATABASE_URL SENDO USADA:', process.env.DATABASE_URL);

const app = express();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0'; // Aceitar conexões de qualquer endereço na rede

// Configuração de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://192.168.3.12:3000',
    'https://vet-system-frontend-blitz.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(cors(corsOptions));
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

// Inicia o servidor
app.listen(PORT, HOST, () => {
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
  console.log('✨ O PulseVet agora é um sistema PROATIVO!');
  console.log('==========================================\n');
});