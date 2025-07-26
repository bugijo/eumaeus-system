import apiClient from './apiClient';

export interface DashboardStats {
  tutorCount: number;
  petCount: number;
  appointmentCount: number;
  productCount: number;
  monthlyRevenue: number;
}

export interface UpcomingAppointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  pet: {
    name: string;
  };
}

export interface RecentActivity {
  id: string;
  description: string;
  date: string;
  type: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
};

export const getUpcomingAppointments = async (): Promise<UpcomingAppointment[]> => {
  const { data } = await apiClient.get('/dashboard/upcoming-appointments');
  return data;
};

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  const { data } = await apiClient.get('/dashboard/recent-activities');
  return data;
};