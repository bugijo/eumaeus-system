
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Stethoscope, 
  PawPrint, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  TrendingDown,
  Activity,
  Calendar,
  FileText,
  CreditCard,
  XCircle
} from 'lucide-react';

import DashboardService from '@/services/dashboardService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUpdateAppointmentStatus } from '@/api/medicalRecordApi';

const Dashboard = () => {
  // Estados para o modal de ações do agendamento
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const updateStatus = useUpdateAppointmentStatus();
  
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: DashboardService.getStats,
  });

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

  const { data: upcomingAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: () => DashboardService.getUpcomingAppointments(),
  });

  const { data: recentActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => DashboardService.getRecentActivities(),
  });

  // Funções para lidar com ações do agendamento
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsStatusModalOpen(true);
  };
  
  const handleStatusUpdate = (status) => {
    if (!selectedAppointment) return;
    
    updateStatus.mutate(
      { appointmentId: selectedAppointment.id, status },
      {
        onSuccess: () => {
          setIsStatusModalOpen(false);
          setSelectedAppointment(null);
        },
      }
    );
  };
  
  // ============ NOSSOS ESPIÕES ============
  console.log('DADOS REAIS DE AGENDAMENTOS:', upcomingAppointments);
  console.log('DADOS REAIS DE ATIVIDADES:', recentActivities);
  // ========================================

  return (
    <div className="bg-background p-6 rounded-xl space-y-6">
      {/* Cabeçalho Aprimorado */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Cockpit da Clínica</h1>
              <p className="text-muted-foreground">Visão geral e controle total da sua clínica veterinária</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Atualizado agora</span>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards Aprimorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.positive ? TrendingUp : TrendingDown;
          return (
            <Card key={index} className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-3 rounded-xl bg-primary/10 shadow-sm">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {!stat.isStatic && isLoadingStats ? (
                    <LoadingSpinner />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center text-xs">
                  <TrendIcon className={`h-3 w-3 mr-1 ${stat.positive ? 'text-secondary' : 'text-primary'}`} />
                  <span className={stat.positive ? 'text-secondary' : 'text-primary'}>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments - Agora Interativo */}
        <Card className="bg-card rounded-lg shadow-md">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Próximos Agendamentos
              </div>
              <Badge variant="outline" className="text-xs">
                {upcomingAppointments?.length || 0} agendamentos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appt, index: number) => (
                  <div 
                    key={appt.id} 
                    onClick={() => handleAppointmentClick(appt)}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/20 group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{appt.pet?.name || 'Pet não identificado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appt.appointmentDate).toLocaleDateString('pt-BR')} • {appt.serviceType || 'Consulta'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-foreground">{appt.appointmentTime}</span>
                      <Badge 
                        className={
                          appt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                          appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          appt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                          'bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted'
                        }
                      >
                        {appt.status === 'SCHEDULED' ? 'Agendado' : 
                         appt.status === 'CONFIRMED' ? 'Confirmado' :
                         appt.status === 'COMPLETED' ? 'Finalizado' : appt.status}
                      </Badge>
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-xs">Clique para ações</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum agendamento próximo</p>
                  <p className="text-sm">Os próximos agendamentos aparecerão aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities - Feed Aprimorado */}
        <Card className="bg-card rounded-lg shadow-md">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Feed de Atividades
              </div>
              <Badge variant="outline" className="text-xs">
                Tempo real
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingActivities ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity, index: number) => {
                  // Determinar ícone e cor baseado no tipo de atividade
                  const getActivityIcon = (type: string, description: string) => {
                    switch (type) {
                      case 'tutor': return { icon: Users, color: 'text-primary', bg: 'bg-primary/10' };
                      case 'payment': return { icon: CreditCard, color: 'text-secondary', bg: 'bg-secondary/10' };
                      case 'appointment': return { icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' };
                      case 'stock': return { icon: Package, color: 'text-primary', bg: 'bg-primary/10' };
                      case 'consultation': return { icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10' };
                      default: {
                        // Fallback baseado na descrição
                        if (description.includes('pet') || description.includes('animal')) {
                          return { icon: PawPrint, color: 'text-secondary', bg: 'bg-secondary/10' };
                        }
                        return { icon: Activity, color: 'text-primary', bg: 'bg-primary/10' };
                      }
                    }
                  };
                  
                  const { icon: IconComponent, color, bg } = getActivityIcon(activity.type, activity.description);
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all duration-200 border border-transparent hover:border-primary/10">
                      <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                        <IconComponent className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-relaxed">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                           <p className="text-xs text-muted-foreground">
                             {new Date(activity.timestamp).toLocaleDateString('pt-BR')} às {new Date(activity.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                           </p>
                           <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                           <p className="text-xs text-muted-foreground">
                             há {Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / (1000 * 60))} min
                           </p>
                         </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma atividade recente</p>
                  <p className="text-sm">As atividades da clínica aparecerão aqui em tempo real</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ações do Agendamento */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gradient">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Ações do Agendamento
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedAppointment.pet?.name || 'Pet não identificado'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString('pt-BR')} às {selectedAppointment.appointmentTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: {selectedAppointment.serviceType || 'Consulta'}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {selectedAppointment?.status === 'SCHEDULED' && (
              <Button
                onClick={() => handleStatusUpdate('CONFIRMED')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            )}
            {(selectedAppointment?.status === 'CONFIRMED' || selectedAppointment?.status === 'SCHEDULED') && (
              <Button
                onClick={() => handleStatusUpdate('COMPLETED')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            )}
            <Button
              onClick={() => handleStatusUpdate('CANCELLED')}
              variant="destructive"
              className="col-span-2"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Agendamento
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
