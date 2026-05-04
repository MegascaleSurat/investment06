import { create } from 'zustand';

export interface Trade {
  id: number;
  stockCode: string;
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  currentState: string;
  pnlPct: number;
}

export interface Order {
  orderId: string;
  stockCode: string;
  status: string;
  quantity: number;
}

interface TradeState {
  activeTrades: Trade[];
  pendingOrders: Order[];
  stats: {
    totalPnl: number;
    winRate: number;
    activeCount: number;
  };
  setTrades: (trades: Trade[]) => void;
  updateTradeState: (tradeId: number, newState: string) => void;
  setStats: (stats: TradeState['stats']) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  activeTrades: [],
  pendingOrders: [],
  stats: {
    totalPnl: 0,
    winRate: 0,
    activeCount: 0,
  },
  setTrades: (activeTrades) => set({ activeTrades }),
  updateTradeState: (tradeId, newState) => set((state) => ({
    activeTrades: state.activeTrades.map((t) => 
      t.id === tradeId ? { ...t, currentState: newState } : t
    ),
  })),
  setStats: (stats) => set({ stats }),
}));
