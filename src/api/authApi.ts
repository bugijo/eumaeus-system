// Em src/api/authApi.ts
import apiClient from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Credenciais inválidas';
      throw new Error(message);
    }
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao renovar token';
      throw new Error(message);
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};