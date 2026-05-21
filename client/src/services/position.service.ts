// Service fetching and updating active and historical trade positions
import api from './api'
import type { TradePosition } from '../types/trade.types'

export const positionService = {
  getPositions: () => api.get<TradePosition[]>('/positions'),
  getPositionById: (id: string) => api.get<TradePosition>(`/positions/${id}`),
  updatePositionStopLoss: (id: string, stopLoss: number) => api.patch(`/positions/${id}/sl`, { stopLoss }),
  closePosition: (id: string) => api.post(`/positions/${id}/close`),
}
