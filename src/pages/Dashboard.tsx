
import React, { useState } from 'react';
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
  
  // ============ NOSSOS ESPIÕES ============
  console.log('DADOS REAIS DE AGENDAMENTOS:', upcomingAppointments);
  console.log('DADOS REAIS DE ATIVIDADES:', recentActivities);
  // ========================================

  return (
    <div className="bg-background p-6 rounded-xl space-y-6">
      {/* Cabeçalho */}
      <DashboardHeader />
      
      {/* Statistics Cards */}
      <DashboardStats stats={stats} isLoading={isLoadingStats} />

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
