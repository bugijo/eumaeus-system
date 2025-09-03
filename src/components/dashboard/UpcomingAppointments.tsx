import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { VirtualAppointmentList } from '@/components/ui/VirtualScrolling';
import { AppointmentListSkeleton } from '@/components/ui/SkeletonLoader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  pet?: {
    name: string;
  };
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  isLoading: boolean;
  onAppointmentClick: (appointment: Appointment) => void;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  isLoading,
  onAppointmentClick
}) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'COMPLETED':
        return 'Finalizado';
      default:
        return status;
    }
  };

  return (
    <Card className="bg-card rounded-lg shadow-md">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Próximos Agendamentos
          </div>
          <Badge variant="outline" className="text-xs">
            {appointments?.length || 0} agendamentos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            <AppointmentListSkeleton />
          ) : appointments && appointments.length > 0 ? (
            appointments.length > 10 ? (
              <VirtualAppointmentList
                appointments={appointments}
                onAppointmentClick={onAppointmentClick}
                loading={false}
              />
            ) : (
              appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  onClick={() => onAppointmentClick(appt)}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/20 group"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {appt.pet?.name || 'Pet não identificado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appt.tutor?.name || 'Tutor não identificado'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(appt.appointmentDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(appt.appointmentDate)}
                    </p>
                  </div>
                </div>
              ))
            )
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
  );
};