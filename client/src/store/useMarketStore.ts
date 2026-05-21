// Zustand global store for live market status and stock price updates
import { create } from 'zustand'
import { MarketStatus } from '../types/enums'
import type { LivePriceData } from '../types/market.types'

interface MarketStore {
  marketStatus: MarketStatus
  livePrices: Record<string, LivePriceData>
  setMarketStatus: (status: MarketStatus) => void
  updateLivePrice: (data: LivePriceData) => void
}

export const useMarketStore = create<MarketStore>((set) => ({
  marketStatus: MarketStatus.NEUTRAL,
  livePrices: {},
  setMarketStatus: (status) => set({ marketStatus: status }),
  updateLivePrice: (data) => set((state) => ({
    livePrices: { ...state.livePrices, [data.stockCode]: data }
  })),
}))
