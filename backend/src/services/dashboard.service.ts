import { TutorService } from './tutor.service';
import { PetService } from './pet.service';
import { AppointmentService } from './appointment.service';
import { ProductService } from './product.service';

export interface DashboardStats {
  tutorCount: number;
  petCount: number;
  appointmentCount: number;
  productCount: number;
  recentAppointments: any[];
  monthlyRevenue: number;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    try {
      // Buscar dados dos serviços mockados
      const tutors = await TutorService.getAllTutors();
      const pets = await PetService.getAllPets();
      const appointments = await AppointmentService.getAllAppointments();
      const products = await ProductService.getAllProducts();

      // Buscar agendamentos recentes (últimos 5)
      const recentAppointments = appointments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // Calcular receita mensal simulada
      const currentMonth = new Date().getMonth();
      const monthlyRevenue = appointments
        .filter(apt => new Date(apt.date).getMonth() === currentMonth)
        .reduce((total, apt) => total + 150, 0); // Preço padrão de R$ 150

      return {
        tutorCount: tutors.length,
        petCount: pets.length,
        appointmentCount: appointments.length,
        productCount: products.length,
        recentAppointments,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  static async getRecentActivity(): Promise<any[]> {
    try {
      const appointments = await AppointmentService.getAllAppointments();
      
      // Retornar atividades recentes (últimos 10 agendamentos)
      return appointments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(apt => ({
          id: apt.id,
          type: 'appointment',
          description: `Consulta agendada para ${apt.pet?.name || 'Pet'}`,
          date: apt.date,
          status: apt.status
        }));
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      throw new Error('Erro interno do servidor');
    }
  }
}