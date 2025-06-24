
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  PawPrint
} from 'lucide-react';

const Agendamentos = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Generate week days
  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays(currentWeek);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Sample appointments data
  const appointments = [
    {
      id: 1,
      pet: 'Max',
      service: 'Consulta Geral',
      time: '09:00',
      duration: 60,
      status: 'Confirmado',
      day: 1 // Monday
    },
    {
      id: 2,
      pet: 'Luna',
      service: 'Vacinação',
      time: '10:30',
      duration: 30,
      status: 'Confirmado', 
      day: 1
    },
    {
      id: 3,
      pet: 'Thor',
      service: 'Cirurgia',
      time: '14:00',
      duration: 120,
      status: 'Agendado',
      day: 2 // Tuesday
    },
    {
      id: 4,
      pet: 'Mia',
      service: 'Dermatologia',
      time: '15:30',
      duration: 45,
      status: 'Confirmado',
      day: 3 // Wednesday
    },
    {
      id: 5,
      pet: 'Rex',
      service: 'Exame Sangue',
      time: '16:45',
      duration: 30,
      status: 'Pendente',
      day: 4 // Thursday
    },
    {
      id: 6,
      pet: 'Bella',
      service: 'Limpeza Dental',
      time: '11:00',
      duration: 90,
      status: 'Confirmado',
      day: 5 // Friday
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Agendado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-primary" />
          Agenda de Atendimentos
        </h1>
        <Button className="gradient-pink text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {weekDays[0].toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayAppointments = appointments.filter(apt => apt.day === index);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="min-h-[400px]">
                  {/* Day Header */}
                  <div className={`text-center p-3 rounded-t-lg border-b ${
                    isToday 
                      ? 'bg-primary text-primary-foreground font-bold' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <div className="text-sm font-medium">{dayNames[index]}</div>
                    <div className="text-lg font-bold">{day.getDate()}</div>
                  </div>

                  {/* Day Content */}
                  <div className="border border-t-0 rounded-b-lg p-2 bg-white h-full">
                    <div className="space-y-2">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-2 rounded-md border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                        >
                          <div className="flex items-center text-xs font-medium mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center text-xs font-semibold mb-1">
                            <PawPrint className="h-3 w-3 mr-1" />
                            {appointment.pet}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {appointment.service}
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-700">8</div>
              <div className="text-sm text-green-600">Consultas Agendadas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">2</div>
              <div className="text-sm text-blue-600">Cirurgias Previstas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">3</div>
              <div className="text-sm text-yellow-600">Pendentes Confirmação</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agendamentos;
