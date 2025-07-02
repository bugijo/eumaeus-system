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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3333;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', tutor_routes_1.tutorRoutes);
app.use('/api', pet_routes_1.petRoutes);
app.use('/api', appointment_routes_1.appointmentRoutes);
app.use('/api', medicalRecord_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'VetSystem API está funcionando!' });
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 API disponível em: http://localhost:${PORT}`);
    console.log(`👥 Endpoint de tutores: http://localhost:${PORT}/api/tutors`);
    console.log(`🐾 Endpoint de pets: http://localhost:${PORT}/api/pets`);
    console.log(`📅 Endpoint de agendamentos: http://localhost:${PORT}/api/appointments`);
    console.log(`🩺 Endpoint de prontuários: http://localhost:${PORT}/api/records`);
    console.log(`📦 Endpoint de produtos: http://localhost:${PORT}/api/products`);
});
//# sourceMappingURL=server.js.map