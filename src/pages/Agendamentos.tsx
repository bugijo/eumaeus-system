
import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { useAppointments } from '../api/appointmentApi';
import { useUpdateAppointmentStatus } from '../api/medicalRecordApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { AppointmentFormModal } from '../components/forms/AppointmentForm';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { LegacyMedicalRecordForm } from '../components/forms/MedicalRecordForm';
import { combineAppointmentDateTime } from '../lib/utils';
import '../styles/calendar.css';

export default function Agendamentos() {
  const { data: appointments = [], isLoading, isError } = useAppointments();
  

  
  // States para controlar o modal de edição/criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMedicalRecordModalOpen, setIsMedicalRecordModalOpen] = useState(false);
  
  const updateStatus = useUpdateAppointmentStatus();

  // Formata os dados para o formato que o FullCalendar entende
  const calendarEvents = useMemo(() => {
    if (!appointments?.length) return [];
    
    const events = appointments.flatMap(apt => {
      // Mapeia o status do backend para as classes CSS
      const statusMap = {
        'SCHEDULED': 'scheduled',
        'CONFIRMED': 'confirmed', 
        'COMPLETED': 'completed',
        'CANCELLED': 'cancelled',
        'Agendado': 'scheduled',
        'Confirmado': 'confirmed',
        'Concluído': 'completed',
        'Cancelado': 'cancelled'
      };
      
      const cssStatus = statusMap[apt.status] || 'scheduled';
      const start = combineAppointmentDateTime(apt.date || apt.appointmentDate, apt.time);
      if (!start) return [];
      
      const event = {
        id: apt.id.toString(),
        title: `${apt.serviceType} - Pet ID: ${apt.petId}`,
        start,
        className: `event-${cssStatus}`,
        extendedProps: {
          petId: apt.petId,
          tutorId: apt.tutorId,
          serviceType: apt.serviceType,
          status: apt.status,
          originalAppointment: apt
        }
      };
      

      
      return [event];
    });
    
    return events;
  }, [appointments]);

  const handleDateClick = (arg) => {
    // Lógica para abrir o modal de CRIAÇÃO de agendamento
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg) => {
    // Lógica para abrir o modal de ações do agendamento
    setSelectedAppointment(arg.event.extendedProps.originalAppointment);
    setIsStatusModalOpen(true);
  };
  
  const handleStatusUpdate = (status) => {
    if (!selectedAppointment) return;
    
    updateStatus.mutate(
      { appointmentId: selectedAppointment.id, status },
      {
        onSuccess: () => {
          // Este código SÓ roda DEPOIS que a API respondeu
          // e a invalidação padrão do hook já foi disparada.
          setIsStatusModalOpen(false);
          setSelectedAppointment(null);
        },
      }
    );
  };
  
  const handleEditAppointment = () => {
    setSelectedEvent(selectedAppointment);
    setIsStatusModalOpen(false);
    setIsModalOpen(true);
  };
  
  const handleCreateMedicalRecord = () => {
    setIsStatusModalOpen(false);
    setIsMedicalRecordModalOpen(true);
  };
  
  const handleMedicalRecordSuccess = () => {
    setIsMedicalRecordModalOpen(false);
    setSelectedAppointment(null);
    // Atualizar status para COMPLETED automaticamente
    if (selectedAppointment) {
      handleStatusUpdate('COMPLETED');
    }
  };

  const handleNewAppointment = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSuccess = () => {
    // Recarregar dados após sucesso
    handleCloseModal();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  if (isError) {
    return <div className="text-red-500 text-center">Erro ao carregar os agendamentos.</div>;
  }

  return (
    <div className="!bg-background p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Agenda de Atendimentos</h1>
          <p className="text-muted-foreground">Gerencie consultas e acompanhe a agenda da clínica</p>
        </div>
        <button
          onClick={handleNewAppointment}
          data-cy="btn-novo-agendamento"
          className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200"
        >
          + Novo Agendamento
        </button>
      </div>
      
      {/* Legenda de status */}
      <div className="status-legend mb-4">
        <div className="status-item">
          <div className="status-color scheduled"></div>
          <span>Agendado</span>
        </div>
        <div className="status-item">
          <div className="status-color confirmed"></div>
          <span>Confirmado</span>
        </div>
        <div className="status-item">
          <div className="status-color completed"></div>
          <span>Finalizado</span>
        </div>
        <div className="status-item">
          <div className="status-color cancelled"></div>
          <span>Cancelado</span>
        </div>
      </div>

      <div style={{ height: '75vh' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          locale={ptBrLocale}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
          }}
          height="100%"
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a sábado
            startTime: '08:00',
            endTime: '18:00'
          }}
          eventDidMount={(info) => {
            // Evento montado no calendário
          }}
          eventsSet={(events) => {
            // Eventos definidos no calendário
          }}
        />
      </div>
      
      {/* Modal de formulário de agendamento */}
      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        appointment={selectedEvent}
        onSuccess={handleSuccess}
      />
      
      {/* Modal de ações do agendamento */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ações do Agendamento</DialogTitle>
            <DialogDescription>
              Escolha uma ação para este agendamento. Você pode confirmar, finalizar, cancelar, criar prontuário ou editar os detalhes.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Serviço:</strong> {selectedAppointment.serviceType}</p>
                <p><strong>Data:</strong> {selectedAppointment.date}</p>
                <p><strong>Horário:</strong> {selectedAppointment.time}</p>
                <p><strong>Status atual:</strong> {selectedAppointment.status || 'SCHEDULED'}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => handleStatusUpdate('CONFIRMED')}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={updateStatus.isPending}
                >
                  Confirmar Agendamento
                </Button>
                
                <Button 
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={updateStatus.isPending}
                >
                  Finalizar Atendimento
                </Button>
                
                <Button 
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  variant="destructive"
                  disabled={updateStatus.isPending}
                >
                  Cancelar Agendamento
                </Button>
                
                <Button 
                   onClick={handleCreateMedicalRecord}
                   className="bg-purple-500 hover:bg-purple-600"
                 >
                   Criar Prontuário
                 </Button>
                 
                 <Button 
                   onClick={handleEditAppointment}
                   variant="outline"
                 >
                   Editar Agendamento
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
       </Dialog>
       
       {/* Modal de formulário de prontuário médico */}
       {selectedAppointment && (
         <LegacyMedicalRecordForm
           isOpen={isMedicalRecordModalOpen}
           onClose={() => setIsMedicalRecordModalOpen(false)}
           appointmentId={selectedAppointment.id}
           onSuccess={handleMedicalRecordSuccess}
         />
       )}
     </div>
   );
 };
