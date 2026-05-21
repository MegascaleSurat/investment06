// Query cache keys for React Query queries and mutations
export const QUERY_KEYS = {
  MARKET_STATUS: ['market', 'status'] as const,
  SECTORS: ['sectors'] as const,
  TRACKED_STOCKS: ['stocks', 'tracked'] as const,
  POSITIONS: ['positions'] as const,
  OPEN_ORDERS: ['orders', 'open'] as const,
  TRADE_HISTORY: ['trades', 'history'] as const,
  STRATEGIES: ['strategies'] as const,
  ALERTS: ['alerts'] as const,
  LOGS: (page: number) => ['logs', page] as const,
  POSITION_BY_ID: (id: string) => ['positions', id] as const,
} as const
