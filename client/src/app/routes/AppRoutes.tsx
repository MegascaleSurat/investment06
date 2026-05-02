import { Routes, Route, Navigate } from 'react-router-dom';
import TrackedStocksPage from '../../pages/TrackedStocks';
import LoginPage from '@/pages/auth/login';
import AdminLayout from '@/pages/admin/layout';
import UsersManagementPage from '@/pages/admin/users';
import AdminDashboard from '@/pages/admin/dashboard';
import SignupPage from '@/pages/auth/register';
import UserDashboard from '@/pages/user/dashboard';
import UserLayout from '@/pages/user/layout';
import ProtectedRoute from '@/app/routes/ProtectedRoute';
import AdminRoute from '@/app/routes/AdminRoute';
import ProfilePage from '@/pages/user/profile';
import ChangePasswordPage from '@/pages/user/change-password';
import KiteConnectPage from '@/pages/kite/KiteConnectPage';
import KiteCallbackPage from '@/pages/kite/KiteCallbackPage';
import ZerodhaProfilePage from '@/pages/zerodha/ZerodhaProfilePage';
import MarketLivePage from '@/pages/market/MarketLivePage';
import WatchlistPage from '@/pages/market/WatchlistPage';
import SectorsPage from '@/pages/market/SectorsPage';

// Placeholder components
const InvestedStocks = () => <div className="text-2xl font-bold">Invested Stocks</div>;


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="tracked-stocks" element={<TrackedStocksPage />} />
            <Route path="invested-stocks" element={<InvestedStocks />} />
            {/* <Route path="sectors" element={<Sectors />} /> */}
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="zerodha/profile" element={<ZerodhaProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="kite/connect" element={<KiteConnectPage />} />
          <Route path="kite/callback" element={<KiteCallbackPage />} />
          <Route path="tracked-stocks" element={<TrackedStocksPage />} />
          <Route path="invested-stocks" element={<InvestedStocks />} />
          <Route path="sectors" element={<SectorsPage />} />
          <Route path="market/live" element={<MarketLivePage />} />
          <Route path="market/watchlist" element={<WatchlistPage />} />
          <Route path="market/sectors" element={<SectorsPage />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<div className="flex items-center justify-center h-screen text-2xl">404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
