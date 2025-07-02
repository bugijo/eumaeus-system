import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tutorRoutes } from './routes/tutor.routes';
import { petRoutes } from './routes/pet.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import productRoutes from './routes/product.routes';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', tutorRoutes);
app.use('/api', petRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', medicalRecordRoutes);
app.use('/api/products', productRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'VetSystem API está funcionando!' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 API disponível em: http://localhost:${PORT}`);
  console.log(`👥 Endpoint de tutores: http://localhost:${PORT}/api/tutors`);
  console.log(`🐾 Endpoint de pets: http://localhost:${PORT}/api/pets`);
  console.log(`📅 Endpoint de agendamentos: http://localhost:${PORT}/api/appointments`);
  console.log(`🩺 Endpoint de prontuários: http://localhost:${PORT}/api/records`);
  console.log(`📦 Endpoint de produtos: http://localhost:${PORT}/api/products`);
});