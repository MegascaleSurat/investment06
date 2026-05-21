// Zustand global store for user authentication and token handling
import { create } from 'zustand'
import api from '../services/api'

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token') || localStorage.getItem('zt_token'),
  isAuthenticated: !!(localStorage.getItem('token') || localStorage.getItem('zt_token')),
  isLoading: !!(localStorage.getItem('token') || localStorage.getItem('zt_token')), // loading is true initially only if a token exists
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('zt_token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('zt_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  initialize: async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('zt_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      set({ isLoading: true });
      const res = await api.get('/auth/me');
      const payload = res.data as any;
      const rawUser = payload.data || payload;
      
      if (!rawUser) {
        throw new Error('No user data returned from authentication server');
      }

      const mappedUser: User = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.fullName || rawUser.name || 'Trader Account',
        role: rawUser.role,
      };

      // Backport token key if only one exists
      localStorage.setItem('token', token);
      localStorage.setItem('zt_token', token);

      set({ user: mappedUser, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to restore authentication session:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('zt_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}))
