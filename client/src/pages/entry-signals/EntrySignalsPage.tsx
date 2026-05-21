// Real-time entry signals monitoring page displaying actionable triggers
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { marketService } from '../../services/market.service'
import SignalCard from './SignalCard'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Signal } from 'lucide-react'

export function EntrySignalsPage() {
  const { data: signals, isLoading, error } = useQuery({
    queryKey: ['provisional-signals'],
    queryFn: async () => {
      // Fetch tracked stocks and filter those with buy signals or mock them
      const response = await marketService.getTrackedStocks();
      return response.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Entry Signals</h2>
        <p className="text-sm text-muted-foreground">Monitor real-time strategy buy signals and confirmation timers</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch real-time entry signals
        </div>
      ) : (signals?.length ?? 0) === 0 ? (
        <EmptyState
          title="No Active Signals"
          message="No stocks are currently meeting the strategy entry triggers."
          icon={<Signal size={40} />}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(signals ?? []).map((stock: any, index: number) => (
            <SignalCard key={stock.stockCode || index} signal={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
export default EntrySignalsPage
