import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Stethoscope, 
  CheckCircle, 
  FileText, 
  XCircle 
} from 'lucide-react';

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

interface AppointmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onStatusUpdate: (status: string) => void;
}

export const AppointmentActionModal: React.FC<AppointmentActionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onStatusUpdate
}) => {
  if (!appointment) return null;

  const canConfirm = appointment.status === 'SCHEDULED';
  const canComplete = appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gradient">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Ações do Agendamento
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {appointment.pet?.name || 'Pet não identificado'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')} às {appointment.appointmentTime}
              </div>
              <div className="text-sm text-muted-foreground">
                Tipo: {appointment.serviceType || 'Consulta'}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-6">
          {canConfirm && (
            <Button
              onClick={() => onStatusUpdate('CONFIRMED')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}
          
          {canComplete && (
            <Button
              onClick={() => onStatusUpdate('COMPLETED')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
          
          <Button
            onClick={() => onStatusUpdate('CANCELLED')}
            variant="destructive"
            className="col-span-2"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar Agendamento
          </Button>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};