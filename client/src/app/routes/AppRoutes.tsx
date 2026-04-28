import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import TrackedStocksPage from '../../pages/TrackedStocks';
import DashboardPage from '../../pages/Dashboard';
import LoginPage from '@/pages/auth/login';
import AdminLayout from '@/pages/admin/layout';
import UsersManagementPage from '@/pages/admin/users';
import AdminDashboard from '@/pages/admin/dashboard';
import SignupPage from '@/pages/auth/register';

// Placeholder components
const InvestedStocks = () => <div className="text-2xl font-bold">Invested Stocks</div>;
const Sectors = () => <div className="text-2xl font-bold">Sector Analysis</div>;


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/admin" element={<AdminLayout />} >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="tracked-stocks" element={<TrackedStocksPage />} />
        <Route path="invested-stocks" element={<InvestedStocks />} />
        <Route path="sectors" element={<Sectors />} />
      </Route>



      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tracked-stocks" element={<TrackedStocksPage />} />
        <Route path="invested-stocks" element={<InvestedStocks />} />
        <Route path="sectors" element={<Sectors />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<div className="flex items-center justify-center h-screen text-2xl">404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
