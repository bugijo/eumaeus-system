"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const tutor_routes_1 = require("./routes/tutor.routes");
const pet_routes_1 = require("./routes/pet.routes");
const appointment_routes_1 = require("./routes/appointment.routes");
const medicalRecordRoutes_1 = require("./routes/medicalRecordRoutes");
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const availability_routes_1 = __importDefault(require("./routes/availability.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const prescription_routes_1 = __importDefault(require("./routes/prescription.routes"));
const clinicSettings_routes_1 = __importDefault(require("./routes/clinicSettings.routes"));
const reminderService_1 = require("./services/reminderService");
const prisma_1 = require("./lib/prisma");
dotenv_1.default.config();
console.log('============================================================');
console.log('INICIANDO VERIFICAÇÃO DE AMBIENTE...');
console.log(`--> Valor da DATABASE_URL: [${process.env.DATABASE_URL}]`);
console.log('============================================================');
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0';
const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.3.12:3000',
    'https://vet-system-frontend-blitz.vercel.app',
    'https://vet-system-frontend-blitz-git-db1174-giovanni-pereiras-projects.vercel.app'
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
    next();
});
app.use(express_1.default.json());
app.use('/api', tutor_routes_1.tutorRoutes);
app.use('/api', pet_routes_1.petRoutes);
app.use('/api', appointment_routes_1.appointmentRoutes);
app.use('/api/records', medicalRecordRoutes_1.medicalRecordRoutes);
app.use('/api/products', product_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/availability', availability_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api', prescription_routes_1.default);
app.use('/api/settings', clinicSettings_routes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'VetSystem API está funcionando!' });
});
app.get('/health', async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false });
    }
});
node_cron_1.default.schedule('* * * * *', () => {
    console.log('⏰ CRON JOB RODANDO! O sistema de automação está vivo. - ', new Date().toLocaleString());
});
node_cron_1.default.schedule('0 8 * * *', async () => {
    console.log('🌅 Iniciando envio de lembretes automáticos das 8:00...');
    try {
        const results = await reminderService_1.reminderService.sendAllReminders();
        console.log('✅ Lembretes automáticos enviados com sucesso!');
        console.log(`📊 Resumo: ${results.appointments.sent + results.vaccines.sent} enviados, ${results.appointments.failed + results.vaccines.failed} falharam`);
    }
    catch (error) {
        console.error('❌ Erro no envio de lembretes automáticos:', error);
    }
}, {
    timezone: 'America/Sao_Paulo'
});
node_cron_1.default.schedule('55 7 * * *', async () => {
    console.log('🧪 Executando teste do sistema de lembretes...');
    try {
        await reminderService_1.reminderService.testReminderSystem();
    }
    catch (error) {
        console.error('❌ Erro no teste do sistema de lembretes:', error);
    }
}, {
    timezone: 'America/Sao_Paulo'
});
async function bootstrap() {
    try {
        return await new Promise((resolve, reject) => {
            const server = app.listen(PORT, HOST, () => {
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
                console.log('\n🤖 ===== SISTEMA DE AUTOMAÇÃO ATIVADO =====');
                console.log('⏰ Cron job de teste: Rodando a cada minuto (prova de vida)');
                console.log('🧪 Teste do sistema: Todos os dias às 7:55');
                console.log('📧 Envio de lembretes: Todos os dias às 8:00');
                console.log('🌎 Timezone: America/Sao_Paulo');
                console.log('✨ O PulseVet agora é um sistema PROATIVO!');
                console.log('==========================================\n');
                resolve(server);
            });
            server.on('error', (err) => {
                reject(err);
            });
        });
    }
    catch (err) {
        console.error('fatal', err);
        throw err;
    }
}
//# sourceMappingURL=server.js.map