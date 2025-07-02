
import React from 'react';
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
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Consultas Hoje',
      value: '12',
      change: '+5% vs ontem',
      icon: Stethoscope,
      positive: true
    },
    {
      title: 'Pets Cadastrados',
      value: '1.247',
      change: '+12% este mês',
      icon: PawPrint,
      positive: true
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.230',
      change: '+8% vs mês anterior',
      icon: DollarSign,
      positive: true
    },
    {
      title: 'Clientes Ativos',
      value: '892',
      change: '+15% este mês',
      icon: Users,
      positive: true
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
      action: 'Novo cliente cadastrado',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
    </div>
  );
};

export default Dashboard;
