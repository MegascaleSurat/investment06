// Trade history page rendering completed trades and detailed drawers
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../config/queryKeys'
import { positionService } from '../../services/position.service'
import TradeHistoryTable from './TradeHistoryTable'
import TradeDetailDrawer from './TradeDetailDrawer'
import Spinner from '../../components/ui/Spinner'
import type { TradePosition } from '../../types/trade.types'

export function TradeHistoryPage() {
  const [selectedTrade, setSelectedTrade] = useState<TradePosition | null>(null);

  const { data: trades, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.TRADE_HISTORY,
    queryFn: async () => {
      // Fetch historical trades or mock them
      const response = await positionService.getPositions();
      return response.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Trade History</h2>
        <p className="text-sm text-muted-foreground">Examine past rule exits, trade returns, and logs</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch trade history
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <TradeHistoryTable
            trades={trades ?? []}
            onSelectTrade={(trade) => setSelectedTrade(trade)}
          />
        </div>
      )}

      <TradeDetailDrawer
        trade={selectedTrade}
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
export default TradeHistoryPage
