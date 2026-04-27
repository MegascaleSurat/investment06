import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Menu,
  LogOut,
  ChevronRight,
  Settings,
  Bell
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, toggleSidebar } from '../../app/store';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tracked Stocks', path: '/tracked-stocks', icon: TrendingUp },
  { name: 'Invested Stocks', path: '/invested-stocks', icon: Briefcase },
  { name: 'Sectors', path: '/sectors', icon: Settings },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "transition-all duration-300 border-r border-white/10 bg-[#0f0f0f] flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">QuantTrade</h1>}
          <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors group relative",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-blue-400" : "text-gray-400")} />
                {sidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
                {isActive && sidebarOpen && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10">
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-bottom border-white/10 bg-[#0f0f0f] flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-200">
            {navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}
          </h2>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0f0f0f]"></span>
            </Button>
            <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                A
              </div>
              <span className="text-sm font-medium text-gray-300">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
