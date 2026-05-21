// Type definitions for live market price feeds and stock technical metrics
export interface LivePriceData {
  stockCode: string
  ltp: number
  prevClose: number
  todayVolume: number
  updatedAt: string
}

export interface StockMetrics {
  stockCode: string
  priceChangePct: number
  avg10dVolume: number
  volumeRatio: number
  holdingRangePct: number
  stockStatus: string
}
