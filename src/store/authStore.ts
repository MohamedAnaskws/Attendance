import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginApi, getCurrentUser, disconnectWebSocket } from '../services/api';
import type { User } from '../types';
import { setAuth, logout as sharedLogout } from '../utils/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  isAdmin: () => boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('access_token'),
      loading: true,

      login: async (username, password) => {
        try {
          const response = await loginApi(username, password);
          const { access_token, user } = response.data;
          setAuth({ access_token, user });
          set({ user, token: access_token, loading: false });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          set({ loading: false });
          return false;
        }
      },

      logout: () => {
        try { disconnectWebSocket(); } catch (_) {}
        sharedLogout();
        set({ user: null, token: null, loading: false });
      },

      loadUser: async () => {
        const token = get().token || localStorage.getItem('access_token');
        if (!token) {
          set({ loading: false, user: null });
          return;
        }
        try {
          const response = await getCurrentUser();
          set({ user: response.data, token, loading: false });
        } catch (error: any) {
          if (error.response?.status === 401) {
            sharedLogout();
          }
          set({ user: null, token: null, loading: false });
        }
      },

      isAdmin: () => {
        const { user } = get();
        return user?.roleid === 1;
      },

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
