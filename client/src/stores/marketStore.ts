import { create } from 'zustand';

export type MarketStatus = 'STRONG' | 'NEUTRAL' | 'WEAK';

interface MarketState {
  marketStatus: MarketStatus | null;
  niftyChangePct: number | null;
  lastUpdated: string | null;
  setMarketStatus: (status: MarketStatus, change: number) => void;
  reset: () => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  marketStatus: null,
  niftyChangePct: null,
  lastUpdated: null,
  setMarketStatus: (marketStatus, niftyChangePct) => set({
    marketStatus,
    niftyChangePct,
    lastUpdated: new Date().toISOString(),
  }),
  reset: () => set({
    marketStatus: null,
    niftyChangePct: null,
    lastUpdated: null,
  }),
}));
