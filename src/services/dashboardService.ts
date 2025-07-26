import { 
  getDashboardStats, 
  getUpcomingAppointments, 
  getRecentActivities,
  DashboardStats, 
  UpcomingAppointment, 
  RecentActivity 
} from '@/api/dashboardApi';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    return await getDashboardStats();
  }

  static async getUpcomingAppointments(): Promise<UpcomingAppointment[]> {
    return await getUpcomingAppointments();
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    return await getRecentActivities();
  }
}

export default DashboardService;