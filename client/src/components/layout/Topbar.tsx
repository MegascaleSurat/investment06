// Topbar component rendering live market state dot, unread notifications badge, and user credentials
import React from 'react'
import { useMarketStore } from '../../store/useMarketStore'
import { useAlertStore } from '../../store/useAlertStore'
import { useAuthStore } from '../../store/useAuthStore'
import { SidebarTrigger } from '@/components/ui/sidebar'
import StatusDot from '../ui/StatusDot'
import { Bell, User, LogOut } from 'lucide-react'
import { MarketStatus } from '../../types/enums'

export function Topbar() {
  const { marketStatus } = useMarketStore();
  const { alerts } = useAlertStore();
  const { user, logout } = useAuthStore();

  const unreadAlerts = alerts.filter((a) => !a.seen).length;

  const getMarketDotStatus = (status: MarketStatus) => {
    if (status === MarketStatus.STRONG) return 'active';
    if (status === MarketStatus.NEUTRAL) return 'warning';
    return 'error'; // WEAK
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between select-none">
      <div className="flex items-center space-x-3">
        <SidebarTrigger className="mr-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted" />
        <StatusDot status={getMarketDotStatus(marketStatus)} />
        <span className="text-sm font-semibold text-muted-foreground">
          Market Status: <span className="text-foreground capitalize">{marketStatus.toLowerCase()}</span>
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-3xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-card">
              {unreadAlerts}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 border-l border-border pl-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">{user?.name || 'Trader Account'}</p>
              <p className="text-3xs text-muted-foreground capitalize">{user?.role || 'Guest'}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
export default Topbar
