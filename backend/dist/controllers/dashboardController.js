"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.default = {
    async getStats(req, res) {
        try {
            const tutorCount = await prisma.tutor.count();
            const petCount = await prisma.pet.count();
            const appointmentCount = await prisma.appointment.count();
            return res.json({ tutorCount, petCount, appointmentCount, productCount: 0 });
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
        }
    }
};
//# sourceMappingURL=dashboardController.js.map