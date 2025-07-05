
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  PawPrint, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';
import ErrorBoundary from '@/components/utils/ErrorBoundary';
import BuggyComponent from '@/components/utils/BuggyComponent';
import DashboardService from '@/services/dashboardService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Dashboard = () => {
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: DashboardService.getStats,
  });

  const stats = [
    {
      title: 'Total de Agendamentos',
      value: isLoadingStats ? '...' : dashboardStats?.appointmentCount?.toString() || '0',
      change: '+5% vs ontem',
      icon: Stethoscope,
      positive: true,
      isStatic: false
    },
    {
      title: 'Pets Cadastrados',
      value: isLoadingStats ? '...' : dashboardStats?.petCount?.toString() || '0',
      change: '+12% este mês',
      icon: PawPrint,
      positive: true,
      isStatic: false
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.230',
      change: '+8% vs mês anterior',
      icon: DollarSign,
      positive: true,
      isStatic: true
    },
    {
      title: 'Total de Tutores',
      value: isLoadingStats ? '...' : dashboardStats?.tutorCount?.toString() || '0',
      change: '+15% este mês',
      icon: Users,
      positive: true,
      isStatic: false
    },
    {
      title: 'Produtos em Estoque',
      value: isLoadingStats ? '...' : dashboardStats?.productCount?.toString() || '0',
      change: '+8% este mês',
      icon: Package,
      positive: true,
      isStatic: false
    }
  ];

  const appointments = [
    {
      pet: 'Max (Golden Retriever)',
      service: 'Consulta Geral',
      time: '09:00',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      pet: 'Luna (Gato Persa)',
      service: 'Vacinação',
      time: '10:30',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      pet: 'Thor (Pastor Alemão)',
      service: 'Cirurgia',
      time: '14:00',
      status: 'Pendente',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      pet: 'Mia (Gato SRD)',
      service: 'Consulta Dermatologia',
      time: '15:30',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      pet: 'Rex (Labrador)',
      service: 'Exame de Sangue',
      time: '16:45',
      status: 'Pendente',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const activities = [
    {
      action: 'Novo tutor cadastrado',
      detail: 'Maria Silva com seu gato "Whiskers"',
      time: '5 min atrás',
      icon: Users
    },
    {
      action: 'Pagamento recebido',
      detail: 'Consulta de emergência - R$ 180,00',
      time: '12 min atrás',
      icon: DollarSign
    },
    {
      action: 'Agendamento confirmado',
      detail: 'Cirurgia de castração para "Buddy"',
      time: '25 min atrás',
      icon: CheckCircle
    },
    {
      action: 'Estoque baixo',
      detail: 'Vacina antirrábica - 3 unidades restantes',
      time: '1h atrás',
      icon: AlertTriangle
    },
    {
      action: 'Consulta finalizada',
      detail: 'Exame dermatológico para "Princess"',
      time: '2h atrás',
      icon: Stethoscope
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-vet border-gradient">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg gradient-pink">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {!stat.isStatic && isLoadingStats ? (
                    <LoadingSpinner />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  <span className="text-green-600">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card className="card-vet">
          <CardHeader className="border-gradient">
            <CardTitle className="flex items-center text-gradient">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appt, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{appt.pet}</p>
                    <p className="text-sm text-muted-foreground">{appt.service}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-foreground">{appt.time}</span>
                    <Badge className={appt.statusColor}>
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="card-vet">
          <CardHeader className="border-gradient">
            <CardTitle className="flex items-center text-gradient">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Teste dos Error Boundaries */}
      <Card className="card-vet border-dashed border-2 border-yellow-300">
        <CardHeader>
          <CardTitle className="text-yellow-700">🧪 Teste de Error Boundary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esta seção demonstra como os Error Boundaries protegem a aplicação. 
            Clique no botão abaixo para simular um erro - apenas esta seção será afetada.
          </p>
          <ErrorBoundary fallback={
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">✅ Error Boundary Funcionando!</h3>
              <p className="text-red-600 text-sm mt-1">
                O erro foi capturado e isolado. O resto do Dashboard continua funcionando normalmente.
              </p>
            </div>
          }>
            <BuggyComponent />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
