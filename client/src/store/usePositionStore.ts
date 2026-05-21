// Zustand global store for active investment positions and telemetry
import { create } from 'zustand'
import type { TradePosition } from '../types/trade.types'

interface PositionStore {
  positions: TradePosition[]
  updatePosition: (position: TradePosition) => void
  closePosition: (tradeId: string) => void
}

export const usePositionStore = create<PositionStore>((set) => ({
  positions: [],
  updatePosition: (position) => set((state) => {
    const exists = state.positions.some((p) => p.tradeId === position.tradeId);
    return {
      positions: exists
        ? state.positions.map((p) => (p.tradeId === position.tradeId ? position : p))
        : [...state.positions, position],
    };
  }),
  closePosition: (tradeId) => set((state) => ({
    positions: state.positions.filter((p) => p.tradeId !== tradeId),
  })),
}))
