// Invested positions page for tracking and closing active holdings
import React from 'react'
import { useTradeState } from '../../hooks/useTradeState'
import DataTable from '../../components/ui/DataTable'
import PositionRow from './PositionRow'
import PnlBar from './PnlBar'
import TrailingSlVisual from './TrailingSlVisual'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Briefcase } from 'lucide-react'
import type { TradePosition } from '../../types/trade.types'
import { formatCurrency, formatPercent } from '../../utils/formatters'

export function InvestedPositionsPage() {
  const { positions, isLoading, error, closePosition } = useTradeState();

  const columns = [
    {
      header: 'Stock',
      accessor: (item: TradePosition) => <span className="font-bold">{item.stockCode}</span>,
    },
    {
      header: 'Entry Price',
      accessor: (item: TradePosition) => <span>{formatCurrency(item.entryPrice)}</span>,
    },
    {
      header: 'Current Price',
      accessor: (item: TradePosition) => <span>{formatCurrency(item.currentPrice)}</span>,
    },
    {
      header: 'PnL %',
      accessor: (item: TradePosition) => <PnlBar pnlPct={item.pnlPct} />,
    },
    {
      header: 'Trailing SL',
      accessor: (item: TradePosition) => <TrailingSlVisual position={item} />,
    },
    {
      header: 'Days Held',
      accessor: (item: TradePosition) => <span>{item.holdingDays} d</span>,
    },
    {
      header: 'Actions',
      accessor: (item: TradePosition) => (
        <PositionRow position={item} onClose={closePosition} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Invested Positions</h2>
        <p className="text-sm text-muted-foreground">Monitor current holdings, profit-take targets, and trailing stop losses</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch active investment positions
        </div>
      ) : positions.length === 0 ? (
        <EmptyState
          title="No Active Positions"
          message="There are no active stock positions in your portfolio."
          icon={<Briefcase size={40} />}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <DataTable
            data={positions}
            columns={columns}
            keyExtractor={(item) => item.tradeId}
          />
        </div>
      )}
    </div>
  );
}
export default InvestedPositionsPage
