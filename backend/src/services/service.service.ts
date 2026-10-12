import { prisma } from '../lib/prisma';
import { ServiceCategory, ServiceType } from '../models/service.model';
import { getCurrentClinicId } from '../tenantContext';

type CatalogInput = {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  active?: boolean;
};

const toServiceType = (service: {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: unknown;
  category: string;
  active: boolean;
}): ServiceType => ({
  id: service.id,
  name: service.name,
  description: service.description ?? undefined,
  duration: service.durationMinutes,
  price: Number(service.price),
  category: service.category,
  active: service.active,
});

export class ServiceService {
  static async getAllServices(): Promise<ServiceType[]> {
    const services = await prisma.catalogService.findMany({ where: { active: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    return services.map(toServiceType);
  }

  static async getServicesByCategory(): Promise<ServiceCategory[]> {
    const services = await this.getAllServices();
    return [...new Set(services.map(service => service.category))].map(name => ({ name, services: services.filter(service => service.category === name) }));
  }

  static async getServiceById(id: number): Promise<ServiceType | null> {
    const service = await prisma.catalogService.findFirst({ where: { id, active: true } });
    return service ? toServiceType(service) : null;
  }

  static async getServiceByName(name: string): Promise<ServiceType | null> {
    const service = await prisma.catalogService.findFirst({ where: { name: name.trim(), active: true } });
    return service ? toServiceType(service) : null;
  }

  static async getServicesByCategoryName(category: string): Promise<ServiceType[]> {
    const services = await prisma.catalogService.findMany({ where: { category, active: true }, orderBy: { name: 'asc' } });
    return services.map(toServiceType);
  }

  static async searchServices(query: string): Promise<ServiceType[]> {
    const services = await prisma.catalogService.findMany({
      where: { active: true, OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ] },
      orderBy: { name: 'asc' },
    });
    return services.map(toServiceType);
  }

  static async createService(data: CatalogInput): Promise<ServiceType> {
    if (!Number.isInteger(data.duration) || data.duration <= 0 || !Number.isFinite(data.price) || data.price < 0) {
      throw new Error('Preço e duração do serviço são inválidos');
    }
    const service = await prisma.catalogService.create({
      data: { clinicId: getCurrentClinicId() ?? (() => { throw new Error('Contexto da clínica ausente'); })(), name: data.name.trim(), description: data.description?.trim() || null, durationMinutes: data.duration, price: data.price, category: data.category.trim(), active: data.active ?? true },
    });
    return toServiceType(service);
  }

  static async updateService(id: number, data: Partial<CatalogInput>): Promise<ServiceType | null> {
    const current = await prisma.catalogService.findFirst({ where: { id } });
    if (!current) return null;
    if (data.duration !== undefined && (!Number.isInteger(data.duration) || data.duration <= 0)) {
      throw new Error('Duração do serviço é inválida');
    }
    if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) {
      throw new Error('Preço do serviço é inválido');
    }
    const service = await prisma.catalogService.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.duration !== undefined ? { durationMinutes: data.duration } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return toServiceType(service);
  }
}
