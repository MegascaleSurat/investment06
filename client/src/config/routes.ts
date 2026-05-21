// Route paths mapping definitions for the frontend router and sidebar navigation
export const ROUTES = {
  DASHBOARD: '/',
  SECTOR_DASHBOARD: '/sector-dashboard',
  MARKET_STATUS: '/market-status',

  WATCHLIST: '/watchlist',
  TRACKED_STOCKS: '/tracked-stocks',
  ENTRY_SIGNALS: '/entry-signals',

  INVESTED_POSITIONS: '/invested-positions',
  OPEN_ORDERS: '/open-orders',
  TRADE_HISTORY: '/trade-history',
  EXIT_ENGINE: '/exit-engine',

  STRATEGY_BUILDER: '/strategy/builder',
  STRATEGY_LIBRARY: '/strategy/library',
  BACKTESTING: '/backtesting',

  PERFORMANCE: '/performance',
  PNL_ANALYTICS: '/performance/pnl',
  VOLUME_INTELLIGENCE: '/performance/volume',

  BROKER_CONNECTION: '/system/broker',
  RISK_CONTROLS: '/system/risk',
  SYSTEM_LOGS: '/system/logs',
  ALERTS: '/system/alerts',
  SETTINGS: '/system/settings',
  USER_MANAGEMENT: '/system/users',
  
  LOGIN: '/login',
} as const
