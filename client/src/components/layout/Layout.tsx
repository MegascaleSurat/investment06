import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Briefcase, 
  History, 
  Settings, 
  Bell,
  BarChart3
} from 'lucide-react';
import { useMarketStore } from '../../stores/marketStore.ts';
import { useTradeStore } from '../../stores/tradeStore.ts';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tracked Stocks', path: '/tracked', icon: Target },
    { name: 'Invested', path: '/invested', icon: Briefcase },
    { name: 'Orders', path: '/orders', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-slate-900 text-white border-r border-slate-800 hidden md:flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          ZT Trading
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">System Status</div>
        <div className="flex items-center space-x-2 text-xs text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Engine Online</span>
        </div>
      </div>
    </aside>
  );
};

const StatusBadge = ({ status }: { status: 'STRONG' | 'NEUTRAL' | 'WEAK' | null }) => {
  const colors = {
    STRONG: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    NEUTRAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    WEAK: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  if (!status) return null;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {status}
    </span>
  );
};

const TopBar = () => {
  const { marketStatus, niftyChangePct } = useMarketStore();
  const { stats } = useTradeStore();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Market:</span>
          <StatusBadge status={marketStatus || 'NEUTRAL'} />
          {niftyChangePct !== null && (
            <span className={`text-sm font-bold ${niftyChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {niftyChangePct >= 0 ? '+' : ''}{niftyChangePct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Active Trades</div>
            <div className="text-sm font-bold text-slate-900">{stats.activeCount}</div>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 md:ml-[220px]">
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
