// Zustand global store for storing and sorting sector performance metrics
import { create } from 'zustand'
import type { SectorMetrics } from '../types/sector.types'

interface SectorStore {
  sectors: SectorMetrics[]
  setSectors: (sectors: SectorMetrics[]) => void
}

export const useSectorStore = create<SectorStore>((set) => ({
  sectors: [],
  setSectors: (sectors) => set({ sectors }),
}))
