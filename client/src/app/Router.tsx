// Application routing using React Router v6 createBrowserRouter
import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '../config/routes'
import Layout from './Layout'

// Lazy loaded page components
import DashboardPage from '../pages/dashboard/DashboardPage'
import SectorDashboardPage from '../pages/sector-dashboard/SectorDashboardPage'
import MarketStatusPage from '../pages/market-status/MarketStatusPage'
import WatchlistUploadPage from '../pages/watchlist/WatchlistUploadPage'
import TrackedStocksPage from '../pages/tracked-stocks/TrackedStocksPage'
import EntrySignalsPage from '../pages/entry-signals/EntrySignalsPage'
import InvestedPositionsPage from '../pages/invested-positions/InvestedPositionsPage'
import OpenOrdersPage from '../pages/open-orders/OpenOrdersPage'
import TradeHistoryPage from '../pages/trade-history/TradeHistoryPage'
import ExitEnginePage from '../pages/exit-engine/ExitEnginePage'
import StrategyBuilderPage from '../pages/strategy/StrategyBuilderPage'
import StrategyLibraryPage from '../pages/strategy/StrategyLibraryPage'
import BacktestingPage from '../pages/backtesting/BacktestingPage'
import PerformanceReportPage from '../pages/performance/PerformanceReportPage'
import PnlAnalyticsPage from '../pages/performance/PnlAnalyticsPage'
import VolumeIntelligencePage from '../pages/performance/VolumeIntelligencePage'
import BrokerConnectionPage from '../pages/system/BrokerConnectionPage'
import RiskControlsPage from '../pages/system/RiskControlsPage'
import SystemLogsPage from '../pages/system/SystemLogsPage'
import AlertsPage from '../pages/system/AlertsPage'
import SettingsPage from '../pages/system/SettingsPage'
import UserManagementPage from '../pages/system/UserManagementPage'
import LoginPage from '../pages/login/LoginPage'

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.SECTOR_DASHBOARD,
        element: <SectorDashboardPage />,
      },
      {
        path: ROUTES.MARKET_STATUS,
        element: <MarketStatusPage />,
      },
      {
        path: ROUTES.WATCHLIST,
        element: <WatchlistUploadPage />,
      },
      {
        path: ROUTES.TRACKED_STOCKS,
        element: <TrackedStocksPage />,
      },
      {
        path: ROUTES.ENTRY_SIGNALS,
        element: <EntrySignalsPage />,
      },
      {
        path: ROUTES.INVESTED_POSITIONS,
        element: <InvestedPositionsPage />,
      },
      {
        path: ROUTES.OPEN_ORDERS,
        element: <OpenOrdersPage />,
      },
      {
        path: ROUTES.TRADE_HISTORY,
        element: <TradeHistoryPage />,
      },
      {
        path: ROUTES.EXIT_ENGINE,
        element: <ExitEnginePage />,
      },
      {
        path: ROUTES.STRATEGY_BUILDER,
        element: <StrategyBuilderPage />,
      },
      {
        path: ROUTES.STRATEGY_LIBRARY,
        element: <StrategyLibraryPage />,
      },
      {
        path: ROUTES.BACKTESTING,
        element: <BacktestingPage />,
      },
      {
        path: ROUTES.PERFORMANCE,
        element: <PerformanceReportPage />,
      },
      {
        path: ROUTES.PNL_ANALYTICS,
        element: <PnlAnalyticsPage />,
      },
      {
        path: ROUTES.VOLUME_INTELLIGENCE,
        element: <VolumeIntelligencePage />,
      },
      {
        path: ROUTES.BROKER_CONNECTION,
        element: <BrokerConnectionPage />,
      },
      {
        path: ROUTES.RISK_CONTROLS,
        element: <RiskControlsPage />,
      },
      {
        path: ROUTES.SYSTEM_LOGS,
        element: <SystemLogsPage />,
      },
      {
        path: ROUTES.ALERTS,
        element: <AlertsPage />,
      },
      {
        path: ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
      {
        path: ROUTES.USER_MANAGEMENT,
        element: <UserManagementPage />,
      },
    ],
  },
]);
export default router
