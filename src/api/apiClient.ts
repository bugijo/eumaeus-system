// Em src/api/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

// Interceptor de Requisição: Anexa o token em cada chamada
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Lida com tokens expirados
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          // Se não há refresh token, fazer logout
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
        
        // Tentar renovar o token
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3333/api'}/auth/refresh`,
          { refreshToken }
        );
        
        // Salvar os novos tokens
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        
        // Atualizar o header da requisição original
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        
        // Repetir a requisição original com o novo token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Se a renovação falhar, fazer logout
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;