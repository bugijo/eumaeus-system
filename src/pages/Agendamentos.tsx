
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAppointments } from '../api/appointmentApi'; // Verifique se o caminho está correto
import { LoadingSpinner } from '../components/ui/LoadingSpinner'; // Verifique se o caminho está correto
// Importe seu modal de formulário aqui, se ele for separado
// import { AppointmentFormModal } from '../components/forms/AppointmentForm';

// --- Configuração do Localizer (Fora do Componente) ---
// É crucial que isso seja feito apenas uma vez.
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const Agendamentos = () => {
  const { data: appointments, isLoading, isError } = useAppointments();
  
  // States para controlar o modal de edição/criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Memoize a transformação dos eventos para evitar recálculos desnecessários
  const events = useMemo(() => {
    if (!appointments) return [];

    return appointments.map(app => ({
      ...app,
      title: `${app.serviceType} - Pet: ${app.petId}`, // Exemplo de título
      start: moment(`${app.date} ${app.time}`, "YYYY-MM-DD HH:mm").toDate(),
      end: moment(`${app.date} ${app.time}`, "YYYY-MM-DD HH:mm").add(1, 'hours').toDate(), // Assumindo 1h de duração
    }));
  }, [appointments]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleNewAppointment = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  if (isError) {
    return <div className="text-red-500 text-center">Erro ao carregar os agendamentos.</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda de Atendimentos</h1>
        <button
          onClick={handleNewAppointment}
          className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
        >
          + Novo Agendamento
        </button>
      </div>

      <div style={{ height: '75vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
          }}
        />
      </div>
      
      {/* Aqui você renderiza seu modal de formulário.
        Exemplo de como poderia ser:
      */}
      {/*
      {isModalOpen && (
        <AppointmentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          appointmentData={selectedEvent} // Passa os dados do evento para o formulário
        />
      )}
      */}
    </div>
  );
};

export default Agendamentos;
