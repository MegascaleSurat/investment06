import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout.tsx';

// Placeholder components
const SectorDashboard = () => <div className="p-6">Sector Dashboard Content</div>;
const TrackedStocks = () => <div className="p-6">Tracked Stocks Content</div>;
const InvestedStocks = () => <div className="p-6">Invested Stocks Content</div>;
const OrderHistory = () => <div className="p-6">Order History Content</div>;
const Settings = () => <div className="p-6">Settings Content</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <SectorDashboard />,
      },
      {
        path: 'tracked',
        element: <TrackedStocks />,
      },
      {
        path: 'invested',
        element: <InvestedStocks />,
      },
      {
        path: 'orders',
        element: <OrderHistory />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
