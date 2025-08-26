"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const availability_service_1 = require("../services/availability.service");
class AvailabilityController {
    static async getAvailability(req, res) {
        try {
            const { year, month, serviceType } = req.query;
            if (!year || !month) {
                return res.status(400).json({
                    error: 'Parâmetros year e month são obrigatórios',
                    example: '/api/availability?year=2025&month=1'
                });
            }
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            if (isNaN(yearNum) || isNaN(monthNum)) {
                return res.status(400).json({
                    error: 'Year e month devem ser números válidos'
                });
            }
            if (monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    error: 'Month deve estar entre 1 e 12'
                });
            }
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
                return res.status(400).json({
                    error: 'Não é possível consultar disponibilidade de meses passados'
                });
            }
            const request = {
                year: yearNum,
                month: monthNum,
                serviceType: serviceType
            };
            const availability = availability_service_1.AvailabilityService.getAvailability(request);
            return res.json({
                success: true,
                data: availability,
                message: `Disponibilidade para ${monthNum}/${yearNum} calculada com sucesso`
            });
        }
        catch (error) {
            console.error('Erro ao buscar disponibilidade:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor ao calcular disponibilidade',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    static async checkSlotAvailability(req, res) {
        try {
            const { date, time } = req.query;
            if (!date || !time) {
                return res.status(400).json({
                    error: 'Parâmetros date e time são obrigatórios',
                    example: '/api/availability/check?date=2025-01-15&time=09:00'
                });
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    error: 'Date deve estar no formato YYYY-MM-DD'
                });
            }
            const timeRegex = /^\d{2}:\d{2}$/;
            if (!timeRegex.test(time)) {
                return res.status(400).json({
                    error: 'Time deve estar no formato HH:mm'
                });
            }
            const isAvailable = await availability_service_1.AvailabilityService.isSlotAvailable(date, time);
            return res.json({
                success: true,
                data: {
                    date,
                    time,
                    available: isAvailable
                },
                message: `Horário ${time} do dia ${date} ${isAvailable ? 'está disponível' : 'não está disponível'}`
            });
        }
        catch (error) {
            console.error('Erro ao verificar disponibilidade do slot:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor ao verificar disponibilidade',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.AvailabilityController = AvailabilityController;
//# sourceMappingURL=availability.controller.js.map