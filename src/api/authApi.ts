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
      const response = await apiClient.post('/auth/login', credentials, {
        skipAuth: true,
        retry: 0,
        timeout: 4500,
      });

      return response.data;
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status;
      const backendMessage = error?.response?.data?.message;
      const isTimeout =
        error?.name === 'TimeoutError' ||
        /timeout|timed out|tempo limite/i.test(String(error?.message ?? ''));

      let message = 'Nao foi possivel fazer login no momento.';

      if (status === 401) {
        message = 'Credenciais invalidas';
      } else if (status === 403) {
        message = backendMessage || 'Acesso negado para este usuario.';
      } else if (status && status >= 500) {
        message = 'Servidor indisponivel. Tente novamente em instantes.';
      } else if (isTimeout || !status) {
        message = 'Servidor indisponivel no momento. Verifique o backend e tente novamente.';
      } else if (backendMessage) {
        message = backendMessage;
      }

      throw new Error(message);
    }
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken }, {
        skipAuth: true,
        retry: 0,
        timeout: 4000,
      });

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
          Authorization: `Bearer ${token}`,
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  },
};
