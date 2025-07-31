"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_service_1 = require("../services/service.service");
class ServiceController {
    static async getAllServices(req, res) {
        try {
            const { category, search } = req.query;
            let services;
            if (search) {
                services = service_service_1.ServiceService.searchServices(search);
            }
            else if (category) {
                services = service_service_1.ServiceService.getServicesByCategoryName(category);
            }
            else {
                services = service_service_1.ServiceService.getAllServices();
            }
            res.json({
                success: true,
                data: services,
                message: `${services.length} serviços encontrados`,
                total: services.length
            });
        }
        catch (error) {
            console.error('Erro ao buscar serviços:', error);
            res.status(500).json({
                error: 'Erro interno do servidor ao buscar serviços',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    static async getServicesByCategory(req, res) {
        try {
            const categories = service_service_1.ServiceService.getServicesByCategory();
            res.json({
                success: true,
                data: categories,
                message: `${categories.length} categorias encontradas`,
                total: categories.length
            });
        }
        catch (error) {
            console.error('Erro ao buscar categorias de serviços:', error);
            res.status(500).json({
                error: 'Erro interno do servidor ao buscar categorias',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    static async getServiceById(req, res) {
        try {
            const { id } = req.params;
            const serviceId = parseInt(id);
            if (isNaN(serviceId)) {
                return res.status(400).json({
                    error: 'ID do serviço deve ser um número válido'
                });
            }
            const service = service_service_1.ServiceService.getServiceById(serviceId);
            if (!service) {
                return res.status(404).json({
                    error: 'Serviço não encontrado'
                });
            }
            res.json({
                success: true,
                data: service,
                message: 'Serviço encontrado com sucesso'
            });
        }
        catch (error) {
            console.error('Erro ao buscar serviço por ID:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor ao buscar serviço',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.ServiceController = ServiceController;
//# sourceMappingURL=service.controller.js.map