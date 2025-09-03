import { 
  Stethoscope, 
  PawPrint, 
  DollarSign, 
  Users, 
  Package 
} from 'lucide-react';
import DashboardService from '@/services/dashboardService';
import { useDashboardQuery } from './useOptimizedQuery';

export const useDashboardData = () => {
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardQuery(
    'stats',
    DashboardService.getStats,
    {
      cacheTTL: 5 * 60 * 1000, // 5 minutos
      staleTime: 2 * 60 * 1000 // 2 minutos
    }
  );

  const { data: upcomingAppointments, isLoading: isLoadingAppointments } = useDashboardQuery(
    'upcoming-appointments',
    DashboardService.getUpcomingAppointments,
    {
      cacheTTL: 2 * 60 * 1000, // 2 minutos (mais dinâmico)
      staleTime: 1 * 60 * 1000 // 1 minuto
    }
  );

  const { data: recentActivities, isLoading: isLoadingActivities } = useDashboardQuery(
    'recent-activities',
    DashboardService.getRecentActivities,
    {
      cacheTTL: 3 * 60 * 1000, // 3 minutos
      staleTime: 1.5 * 60 * 1000 // 1.5 minutos
    }
  );

  const stats = [
    {
      title: 'Total de Agendamentos',
      value: isLoadingStats ? '...' : (dashboardStats?.appointmentCount ?? 0).toString(),
      change: '+5% vs ontem',
      icon: Stethoscope,
      positive: true,
      isStatic: false,
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Pets Cadastrados',
      value: isLoadingStats ? '...' : (dashboardStats?.petCount ?? 0).toString(),
      change: '+12% este mês',
      icon: PawPrint,
      positive: true,
      isStatic: false,
      borderColor: 'border-l-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Receita Mensal',
      value: isLoadingStats ? '...' : `R$ ${(dashboardStats?.monthlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+8% vs mês anterior',
      icon: DollarSign,
      positive: true,
      isStatic: false,
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Total de Tutores',
      value: isLoadingStats ? '...' : (dashboardStats?.tutorCount ?? 0).toString(),
      change: '+15% este mês',
      icon: Users,
      positive: true,
      isStatic: false,
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Produtos em Estoque',
      value: isLoadingStats ? '...' : (dashboardStats?.productCount ?? 0).toString(),
      change: '+8% este mês',
      icon: Package,
      positive: true,
      isStatic: false,
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return {
    stats,
    upcomingAppointments,
    recentActivities,
    isLoadingStats,
    isLoadingAppointments,
    isLoadingActivities
  };
};