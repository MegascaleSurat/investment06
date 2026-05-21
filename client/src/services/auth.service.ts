// Service class managing authentication requests such as login and session validation
import api from './api'
import type { User } from '../store/useAuthStore'

export type UserRole = 'USER' | 'ADMIN'

export const authService = {
  login: (credentials: Record<string, any>) =>
    api.post<{ user: User; token: string }>('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get<User>('/auth/me'),
  register: (data: Record<string, any>) => api.post('/auth/register', data),
}
