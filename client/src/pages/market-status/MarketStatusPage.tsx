// Market status details page monitoring session limits and real-time market thresholds
import React from 'react'
import { useMarketData } from '../../hooks/useMarketData'
import MarketStatusBanner from './MarketStatusBanner'
import StatCard from '../../components/ui/StatCard'
import { Activity, Clock, ShieldAlert } from 'lucide-react'
import { getCurrentSession, isMarketOpen } from '../../utils/sessionTime'

export function MarketStatusPage() {
  const { marketStatus, isLoading } = useMarketData();
  const now = new Date();
  const session = getCurrentSession(now);
  const isOpen = isMarketOpen(now);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Market Status</h2>
        <p className="text-sm text-muted-foreground">Monitor exchange connectivity and intraday thresholds</p>
      </div>

      <MarketStatusBanner status={marketStatus} />

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Current Session"
          value={session}
          icon={<Clock size={18} />}
          subValue={isOpen ? 'Active trading hours' : 'Market is closed'}
        />
        <StatCard
          title="Exchange Connectivity"
          value={isLoading ? 'Connecting...' : 'Online'}
          icon={<Activity size={18} />}
          subValue="Live price feed socket active"
        />
        <StatCard
          title="Safety Lock"
          value={marketStatus === 'WEAK' ? 'Multiplier Active' : 'Off'}
          icon={<ShieldAlert size={18} />}
          subValue="Weak market capital multipliers"
        />
      </div>
    </div>
  );
}
export default MarketStatusPage
