// Service managing retrieving, clear, and read status markers for alerts and notifications
import api from './api'
import type { Alert } from '../store/useAlertStore'

export const alertsService = {
  getAlerts: () => api.get<Alert[]>('/alerts'),
  markAsSeen: (id: string) => api.post(`/alerts/${id}/seen`),
  clearAll: () => api.post('/alerts/clear'),
}
