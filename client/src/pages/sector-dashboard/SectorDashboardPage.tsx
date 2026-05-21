// Sector dashboard page displaying relative strength analysis of market sectors
import React from 'react'
import { useSectorStatus } from '../../hooks/useSectorStatus'
import SectorTable from './SectorTable'
import Spinner from '../../components/ui/Spinner'

export function SectorDashboardPage() {
  const { sectors, isLoading, error } = useSectorStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Sector Strength</h2>
        <p className="text-sm text-muted-foreground">Monitor sector breadth and momentum rankings</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch sector metrics
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <SectorTable sectors={sectors} />
        </div>
      )}
    </div>
  );
}
export default SectorDashboardPage
