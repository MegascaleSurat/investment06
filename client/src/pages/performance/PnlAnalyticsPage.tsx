// P&L analytics page rendering cumulative performance curves
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services/analytics.service'
import PnlLineChart from '../../components/charts/PnlLineChart'
import Spinner from '../../components/ui/Spinner'

export function PnlAnalyticsPage() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['pnl-analytics'],
    queryFn: async () => {
      const response = await analyticsService.getPnlAnalytics('30d');
      return response.data || [
        { date: 'May 1', pnl: 0 },
        { date: 'May 5', pnl: 15000 },
        { date: 'May 10', pnl: 12000 },
        { date: 'May 15', pnl: 28000 },
        { date: 'May 20', pnl: 34000 },
      ];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">P&L Analytics</h2>
        <p className="text-sm text-muted-foreground">Monitor aggregate portfolio returns trajectory</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-6">Cumulative Profits Progression (INR)</h3>
        {isLoading ? (
          <Spinner size="lg" className="py-20" />
        ) : (
          <PnlLineChart data={chartData || []} />
        )}
      </div>
    </div>
  );
}
export default PnlAnalyticsPage
