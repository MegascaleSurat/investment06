// Service fetching paginated system operational and execution log feeds
import api from './api'

export const logsService = {
  getSystemLogs: (page: number, limit = 50) =>
    api.get<{ logs: any[]; totalPages: number }>('/logs', { params: { page, limit } }),
}
