"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentProductUsageService = void 0;
const product_service_1 = require("./product.service");
let appointmentProductUsages = [];
let nextId = 1;
class AppointmentProductUsageService {
    static async registerProductUsage(appointmentId, products) {
        try {
            const usages = [];
            const errors = [];
            for (const productUsage of products) {
                const { productId, quantityUsed } = productUsage;
                const product = await product_service_1.ProductService.getProductById(productId);
                if (!product) {
                    errors.push(`Produto com ID ${productId} não encontrado`);
                    continue;
                }
                if (product.quantity < quantityUsed) {
                    errors.push(`Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}, Solicitado: ${quantityUsed}`);
                    continue;
                }
                const updatedProduct = await product_service_1.ProductService.updateProduct(productId, {
                    quantity: product.quantity - quantityUsed
                });
                if (!updatedProduct) {
                    errors.push(`Erro ao atualizar estoque do produto ${product.name}`);
                    continue;
                }
                const usage = {
                    id: nextId++,
                    appointmentId,
                    productId,
                    quantityUsed,
                    usedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
                };
                appointmentProductUsages.push(usage);
                usages.push(usage);
            }
            if (errors.length > 0) {
                return {
                    success: false,
                    message: `Alguns produtos não puderam ser processados: ${errors.join(', ')}`,
                    usages: usages.length > 0 ? usages : undefined
                };
            }
            return {
                success: true,
                message: `${usages.length} produto(s) registrado(s) com sucesso`,
                usages
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro interno do servidor ao registrar uso de produtos'
            };
        }
    }
    static async getUsagesByAppointment(appointmentId) {
        return appointmentProductUsages.filter(usage => usage.appointmentId === appointmentId);
    }
    static async getAllUsages() {
        return appointmentProductUsages;
    }
    static async getUsageById(id) {
        const usage = appointmentProductUsages.find(u => u.id === id);
        return usage || null;
    }
}
exports.AppointmentProductUsageService = AppointmentProductUsageService;
//# sourceMappingURL=appointmentProductUsage.service.js.map