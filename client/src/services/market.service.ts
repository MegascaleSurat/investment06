// Service retrieving live stock data feed, price metrics, and market conditions
import api from './api'
import type { LivePriceData, StockMetrics } from '../types/market.types'
import { MarketStatus } from '../types/enums'

export const marketService = {
  getMarketStatus: () => api.get<{ status: MarketStatus }>('/market/status'),
  getLivePrices: () => api.get<LivePriceData[]>('/market/prices'),
  getStockMetrics: (stockCode: string) => api.get<StockMetrics>(`/market/metrics/${stockCode}`),
  getTrackedStocks: () => api.get<StockMetrics[]>('/market/tracked'),
}
