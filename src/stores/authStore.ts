// Em src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string; // Opcional porque tutores não têm role
  type: 'user' | 'tutor'; // Tipo de usuário para redirecionamento
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      login: (accessToken, refreshToken, user) => set({ 
        token: accessToken, 
        refreshToken, 
        user 
      }),
      setTokens: (accessToken, refreshToken) => set({ 
        token: accessToken, 
        refreshToken 
      }),
      logout: () => set({ 
        token: null, 
        refreshToken: null, 
        user: null 
      }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage', // Nome do item no localStorage
    }
  )
);