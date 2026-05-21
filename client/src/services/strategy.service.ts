// Service managing strategy rules library, configuration and backtesting requests
import api from './api'
import type { StrategyConfig } from '../types/strategy.types'

export const strategyService = {
  getStrategies: () => api.get<StrategyConfig[]>('/strategies'),
  getStrategyById: (id: string) => api.get<StrategyConfig>(`/strategies/${id}`),
  createStrategy: (strategy: Partial<StrategyConfig>) => api.post<StrategyConfig>('/strategies', strategy),
  updateStrategy: (id: string, strategy: Partial<StrategyConfig>) => api.put<StrategyConfig>(`/strategies/${id}`, strategy),
  deleteStrategy: (id: string) => api.delete(`/strategies/${id}`),
  runBacktest: (id: string, params: Record<string, any>) => api.post(`/strategies/${id}/backtest`, params),
}
