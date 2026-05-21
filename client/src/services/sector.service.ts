// Service querying sector performance metrics and relative strength indicators
import api from './api'
import type { SectorMetrics } from '../types/sector.types'

export const sectorService = {
  getSectors: () => api.get<SectorMetrics[]>('/sectors'),
}
