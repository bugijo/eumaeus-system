import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tutorRoutes } from './routes/tutor.routes';
import { petRoutes } from './routes/pet.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { medicalRecordRoutes } from './routes/medicalRecordRoutes';
import productRoutes from './routes/product.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import invoiceRoutes from './routes/invoice.routes';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0'; // Aceitar conexões de qualquer endereço na rede

// Middlewares
app.use(cors());
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

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'VetSystem API está funcionando!' });
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
});