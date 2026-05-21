// Zustand global store for active strategy configuration and strategy library
import { create } from 'zustand'
import type { StrategyConfig } from '../types/strategy.types'

interface StrategyStore {
  strategies: StrategyConfig[]
  activeStrategyId: string | null
  setActiveStrategy: (id: string | null) => void
  setStrategies: (strategies: StrategyConfig[]) => void
}

export const useStrategyStore = create<StrategyStore>((set) => ({
  strategies: [],
  activeStrategyId: null,
  setActiveStrategy: (id) => set({ activeStrategyId: id }),
  setStrategies: (strategies) => set({ strategies }),
}))
