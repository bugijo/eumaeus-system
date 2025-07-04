"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const tutor_routes_1 = require("./routes/tutor.routes");
const pet_routes_1 = require("./routes/pet.routes");
const appointment_routes_1 = require("./routes/appointment.routes");
const medicalRecord_routes_1 = __importDefault(require("./routes/medicalRecord.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', tutor_routes_1.tutorRoutes);
app.use('/api', pet_routes_1.petRoutes);
app.use('/api', appointment_routes_1.appointmentRoutes);
app.use('/api', medicalRecord_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'VetSystem API está funcionando!' });
});
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
});
//# sourceMappingURL=server.js.map