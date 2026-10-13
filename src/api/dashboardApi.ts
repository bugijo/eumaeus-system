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
export interface AssistantAlert { id: string; source: string; kind: string; title: string; reason: string; dueAt?: string; href: string; }
export interface AssistantSummary { generatedAt: string; clinicId: number; alerts: AssistantAlert[]; }

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
export const getAssistantSummary = async (): Promise<AssistantSummary> => {
  const { data } = await apiClient.get('/dashboard/assistant');
  return data;
};
export interface AssistantReminder { id: number; reminderKey: string; kind: string; sourceType: string; sourceId: number; title: string; reason: string; status: string; snoozedUntil?: string | null; actions?: Array<{ action: string; reason?: string | null; createdAt: string }>; }
export const getAssistantReminders = async (): Promise<AssistantReminder[]> => (await apiClient.get('/dashboard/assistant/reminders')).data;
export const dismissAssistantReminder = async (id: number, reason: string) => (await apiClient.post(`/dashboard/assistant/reminders/${id}/dismiss`, { reason })).data;
export const snoozeAssistantReminder = async (id: number, until: string, reason: string) => (await apiClient.post(`/dashboard/assistant/reminders/${id}/snooze`, { until, reason })).data;
export const resolveAssistantReminder = async (id: number, reason: string) => (await apiClient.post(`/dashboard/assistant/reminders/${id}/resolve`, { reason })).data;
