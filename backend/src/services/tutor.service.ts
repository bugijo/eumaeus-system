import { Tutor } from '../models/tutor.model';
import { prisma } from '../lib/prisma';

const isTestEnv = process.env.NODE_ENV === 'test';

export class ServiceError extends Error {
  constructor(message: string, public statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
  }
}

type TutorInput = Partial<Tutor> & {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address?: any;
};

type MemoryTutor = TutorInput & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const memoryStore: { tutors: MemoryTutor[]; nextId: number } = {
  tutors: [],
  nextId: 1,
};

const normalizeTutor = (tutor: any): Tutor => {
  const addressValue =
    tutor.address && typeof tutor.address === 'object' && !(tutor.address instanceof Date)
      ? JSON.stringify(tutor.address)
      : tutor.address ?? null;

  return {
    id: tutor.id,
    name: tutor.name,
    email: tutor.email,
    phone: tutor.phone ?? '',
    address: addressValue,
  };
};

const validateTutorData = (data: any): TutorInput => {
  if (!data || typeof data !== 'object') {
    throw new ServiceError('Dados do tutor inválidos', 400);
  }

  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim();

  if (!name) {
    throw new ServiceError('Nome é obrigatório', 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new ServiceError('E-mail inválido', 400);
  }

  return {
    ...data,
    name,
    email,
  };
};

const ensureNotDuplicate = (email: string) => {
  const exists = memoryStore.tutors.find(
    tutor => tutor.deletedAt === null && tutor.email.toLowerCase() === email.toLowerCase(),
  );

  if (exists) {
    throw new ServiceError('Tutor com este e-mail já existe', 409);
  }
};

const getCurrentMonthBounds = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export class TutorService {
  static async getTutorStats(): Promise<{ total: number; active: number; newThisMonth: number }> {
    try {
      if (isTestEnv) {
        const activeTutors = memoryStore.tutors.filter(tutor => tutor.deletedAt === null);
        const total = activeTutors.length;
        const startOfMonth = getCurrentMonthBounds();
        const newThisMonth = activeTutors.filter(tutor => tutor.createdAt >= startOfMonth).length;

        return {
          total,
          active: total,
          newThisMonth,
        };
      }

      const totalCount = await prisma.tutor.count({
        where: { deletedAt: null },
      });

      const startOfMonth = getCurrentMonthBounds();

      const newThisMonth = await prisma.tutor.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      });

      return {
        total: totalCount,
        active: totalCount,
        newThisMonth,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      console.error('Erro ao buscar estatísticas de tutores:', error);
      throw new ServiceError('Erro interno ao buscar estatísticas de tutores');
    }
  }

  static async getAllTutors(): Promise<Tutor[]> {
    try {
      if (isTestEnv) {
        return memoryStore.tutors
          .filter(tutor => tutor.deletedAt === null)
          .map(normalizeTutor);
      }

      const tutors = await prisma.tutor.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return tutors.map(normalizeTutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      console.error('Erro ao buscar tutores:', error);
      throw new ServiceError('Erro interno ao buscar tutores');
    }
  }

  static async createTutor(newTutorData: any): Promise<Tutor> {
    try {
      const validatedData = validateTutorData(newTutorData);

      if (isTestEnv) {
        ensureNotDuplicate(validatedData.email);

        const now = new Date();
        const createdTutor: MemoryTutor = {
          id: memoryStore.nextId++,
          ...validatedData,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        memoryStore.tutors.push(createdTutor);
        return normalizeTutor(createdTutor);
      }

      const createdTutor = await prisma.tutor.create({
        data: validatedData as any,
      });

      return normalizeTutor(createdTutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error('Erro ao criar tutor:', error);

      if (!isTestEnv && (error as any)?.code === 'P2002') {
        throw new ServiceError('Tutor com este e-mail já existe', 409);
      }

      throw new ServiceError('Erro interno ao criar tutor');
    }
  }

  static async getTutorById(id: number): Promise<Tutor | null> {
    try {
      if (isTestEnv) {
        const tutor = memoryStore.tutors.find(item => item.id === id && item.deletedAt === null);
        return tutor ? normalizeTutor(tutor) : null;
      }

      const tutor = await prisma.tutor.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      return tutor ? normalizeTutor(tutor) : null;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      console.error('Erro ao buscar tutor:', error);
      throw new ServiceError('Erro interno ao buscar tutor');
    }
  }

  static async updateTutor(id: number, updatedData: any): Promise<Tutor | null> {
    try {
      const validatedData = validateTutorData({ ...updatedData, name: updatedData.name ?? '', email: updatedData.email ?? '' });

      if (isTestEnv) {
        const tutorIndex = memoryStore.tutors.findIndex(item => item.id === id && item.deletedAt === null);

        if (tutorIndex === -1) {
          return null;
        }

        const existingTutor = memoryStore.tutors[tutorIndex];

        if (existingTutor.email.toLowerCase() !== validatedData.email.toLowerCase()) {
          ensureNotDuplicate(validatedData.email);
        }

        const updatedTutor: MemoryTutor = {
          ...existingTutor,
          ...validatedData,
          updatedAt: new Date(),
        };

        memoryStore.tutors[tutorIndex] = updatedTutor;
        return normalizeTutor(updatedTutor);
      }

      const updatedTutor = await prisma.tutor.update({
        where: { id },
        data: validatedData as any,
      });

      return normalizeTutor(updatedTutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error('Erro ao atualizar tutor:', error);

      if (!isTestEnv && (error as any)?.code === 'P2002') {
        throw new ServiceError('Tutor com este e-mail já existe', 409);
      }

      throw new ServiceError('Erro interno ao atualizar tutor');
    }
  }

  static async deleteTutor(id: number): Promise<boolean> {
    try {
      if (isTestEnv) {
        const tutor = memoryStore.tutors.find(item => item.id === id && item.deletedAt === null);

        if (!tutor) {
          return false;
        }

        tutor.deletedAt = new Date();
        return true;
      }

      const existingTutor = await prisma.tutor.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!existingTutor) {
        return false;
      }

      await prisma.tutor.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      console.error('Erro ao excluir tutor:', error);
      throw new ServiceError('Erro interno ao excluir tutor');
    }
  }

  static clearTestData() {
    if (isTestEnv) {
      memoryStore.tutors = [];
      memoryStore.nextId = 1;
    }
  }
}
