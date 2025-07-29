"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const tutor_service_1 = require("./tutor.service");
const pet_service_1 = require("./pet.service");
const appointment_service_1 = require("./appointment.service");
const product_service_1 = require("./product.service");
class DashboardService {
    static async getStats() {
        try {
            const tutors = await tutor_service_1.TutorService.getAllTutors();
            const pets = await pet_service_1.PetService.getAllPets();
            const appointments = await appointment_service_1.AppointmentService.getAllAppointments();
            const products = await product_service_1.ProductService.getAllProducts();
            const recentAppointments = appointments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5);
            const currentMonth = new Date().getMonth();
            const monthlyRevenue = appointments
                .filter(apt => new Date(apt.date).getMonth() === currentMonth)
                .reduce((total, apt) => total + (apt.price || 150), 0);
            return {
                tutorCount: tutors.length,
                petCount: pets.length,
                appointmentCount: appointments.length,
                productCount: products.length,
                recentAppointments,
                monthlyRevenue
            };
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas do dashboard:', error);
            throw new Error('Erro interno do servidor');
        }
    }
    static async getRecentActivity() {
        try {
            const appointments = await appointment_service_1.AppointmentService.getAllAppointments();
            return appointments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(apt => ({
                id: apt.id,
                type: 'appointment',
                description: `Consulta agendada para ${apt.petName}`,
                date: apt.date,
                status: apt.status
            }));
        }
        catch (error) {
            console.error('Erro ao buscar atividades recentes:', error);
            throw new Error('Erro interno do servidor');
        }
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map