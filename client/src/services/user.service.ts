// Service class managing administrative user and broker credentials requests
import api from './api'

export interface KiteCredentials {
  id?: string;
  apiKey: string;
  apiSecret?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  kiteCredentials?: KiteCredentials | null;
}

export interface CreateUserResponse {
  user: AdminUser;
  plainPassword: string;
}

export interface ResetPasswordResponse {
  plainPassword: string;
}

export const userService = {
  getUsers: () =>
    api.get<AdminUser[]>('/users'),

  createUser: (data: { fullName: string; email: string; phone?: string; role: string }) =>
    api.post<CreateUserResponse>('/users', data),

  updateUser: (id: string, data: { fullName?: string; email?: string; phone?: string; role?: string; status?: string }) =>
    api.put<AdminUser>(`/users/${id}`, data),

  resetPassword: (id: string) =>
    api.post<ResetPasswordResponse>(`/users/${id}/generate-password`),

  saveKiteCredentials: (id: string, data: { apiKey: string; apiSecret: string }) =>
    api.post<KiteCredentials>(`/users/${id}/kite`, data),
}

export default userService
