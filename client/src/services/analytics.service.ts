// Service retrieving trade analytics, performance metrics, and volume intelligence report data
import api from './api'

export const analyticsService = {
  getPerformanceReport: () => api.get<any>('/analytics/performance'),
  getPnlAnalytics: (range: string) => api.get<any>('/analytics/pnl', { params: { range } }),
  getVolumeIntelligence: () => api.get<any>('/analytics/volume'),
}
