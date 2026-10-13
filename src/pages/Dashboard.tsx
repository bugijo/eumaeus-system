
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAssistantSummary } from '@/api/dashboardApi';
import { useUpdateAppointmentStatus } from '@/api/medicalRecordApi';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  DashboardHeader,
  DashboardStats,
  UpcomingAppointments,
  RecentActivities,
  AppointmentActionModal
} from '@/components/dashboard';

const Dashboard = () => {
  // Estados para o modal de ações do agendamento
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  const updateStatus = useUpdateAppointmentStatus();
  const assistant = useQuery({ queryKey: ['dashboard', 'assistant'], queryFn: getAssistantSummary });
  
  // Hook customizado para dados do dashboard
  const {
    stats,
    upcomingAppointments,
    recentActivities,
    isLoadingStats,
    isLoadingAppointments,
    isLoadingActivities
  } = useDashboardData();

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
  
  return (
    <div className="bg-background p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <DashboardHeader />
      
      {/* Statistics Cards */}
      <DashboardStats stats={stats} isLoading={isLoadingStats} />

      <section className="rounded-xl border bg-card p-4" aria-labelledby="assistant-heading">
        <div className="flex items-center justify-between gap-3"><div><h2 id="assistant-heading" className="font-semibold">Assistente administrativo</h2><p className="text-sm text-muted-foreground">Alertas determinísticos da clínica, sem ações automáticas.</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm">{assistant.isLoading ? '…' : `${assistant.data?.alerts.length ?? 0} pendência(s)`}</span></div>
        {assistant.isError && <p role="alert" className="mt-3 text-sm text-red-700">Não foi possível carregar as pendências administrativas.</p>}
        {!assistant.isLoading && !assistant.isError && <div className="mt-3 grid gap-2 md:grid-cols-2">{(assistant.data?.alerts ?? []).slice(0, 8).map(alert => <a key={alert.id} href={alert.href} className="rounded border p-3 hover:bg-muted"><p className="font-medium">{alert.title}</p><p className="text-sm text-muted-foreground">{alert.reason}{alert.dueAt ? ` · ${new Date(alert.dueAt).toLocaleString('pt-BR')}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">Origem: {alert.source}</p></a>)}{assistant.data?.alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pendência atual.</p>}</div>}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <UpcomingAppointments 
          appointments={upcomingAppointments}
          isLoading={isLoadingAppointments}
          onAppointmentClick={handleAppointmentClick}
        />

        {/* Recent Activities */}
        <RecentActivities 
          activities={recentActivities}
          isLoading={isLoadingActivities}
        />
      </div>

      {/* Modal de Ações do Agendamento */}
      <AppointmentActionModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        appointment={selectedAppointment}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default Dashboard;
