import { AppointmentProductUsage, CreateAppointmentProductUsageData, ProductUsageRequest } from '../models/appointmentProductUsage.model';
import { ProductService } from './product.service';

// Simulação de banco de dados em memória para registros de uso
let appointmentProductUsages: AppointmentProductUsage[] = [];
let nextId = 1;

export class AppointmentProductUsageService {
  static async registerProductUsage(appointmentId: number, products: ProductUsageRequest[]): Promise<{ success: boolean; message: string; usages?: AppointmentProductUsage[] }> {
    try {
      const usages: AppointmentProductUsage[] = [];
      const errors: string[] = [];

      // Validar e processar cada produto
      for (const productUsage of products) {
        const { productId, quantityUsed } = productUsage;

        // Verificar se o produto existe
        const product = await ProductService.getProductById(productId);
        if (!product) {
          errors.push(`Produto com ID ${productId} não encontrado`);
          continue;
        }

        // Verificar se há estoque suficiente
        if (product.quantity < quantityUsed) {
          errors.push(`Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}, Solicitado: ${quantityUsed}`);
          continue;
        }

        // Dar baixa no estoque
        const updatedProduct = await ProductService.updateProduct(productId, {
          quantity: product.quantity - quantityUsed
        });

        if (!updatedProduct) {
          errors.push(`Erro ao atualizar estoque do produto ${product.name}`);
          continue;
        }

        // Criar registro de uso
        const usage: AppointmentProductUsage = {
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
    } catch (error) {
      return {
        success: false,
        message: 'Erro interno do servidor ao registrar uso de produtos'
      };
    }
  }

  static async getUsagesByAppointment(appointmentId: number): Promise<AppointmentProductUsage[]> {
    return appointmentProductUsages.filter(usage => usage.appointmentId === appointmentId);
  }

  static async getAllUsages(): Promise<AppointmentProductUsage[]> {
    return appointmentProductUsages;
  }

  static async getUsageById(id: number): Promise<AppointmentProductUsage | null> {
    const usage = appointmentProductUsages.find(u => u.id === id);
    return usage || null;
  }
}