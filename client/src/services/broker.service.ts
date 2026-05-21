// Service managing integration and credentials connection with external broker APIs
import api from './api'

export const brokerService = {
  getConnectionStatus: () => api.get<{ status: string; brokerName: string }>('/broker/status'),
  connectBroker: (credentials: Record<string, any>) => api.post('/broker/connect', credentials),
  disconnectBroker: () => api.post('/broker/disconnect'),
}
