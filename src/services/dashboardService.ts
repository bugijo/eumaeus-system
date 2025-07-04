import { getDashboardStats, DashboardStats } from '@/api/dashboardApi';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    return await getDashboardStats();
  }
}

export default DashboardService;