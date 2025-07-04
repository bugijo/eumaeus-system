import apiClient from './apiClient';

export interface DashboardStats {
  tutorCount: number;
  petCount: number;
  appointmentCount: number;
  productCount: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
};