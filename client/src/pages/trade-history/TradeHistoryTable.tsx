// Trade history data grid listing past trades and detail drawer links
import React from 'react'
import type { TradePosition } from '../../types/trade.types'
import DataTable from '../../components/ui/DataTable'
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters'

interface TradeHistoryTableProps {
  trades: TradePosition[]
  onSelectTrade: (trade: TradePosition) => void
}

export function TradeHistoryTable({ trades, onSelectTrade }: TradeHistoryTableProps) {
  const columns = [
    {
      header: 'Stock',
      accessor: (item: TradePosition) => <span className="font-bold">{item.stockCode}</span>,
    },
    {
      header: 'Entry Date',
      accessor: (item: TradePosition) => <span>{formatDate(item.entryDate)}</span>,
    },
    {
      header: 'Entry Price',
      accessor: (item: TradePosition) => <span>{formatCurrency(item.entryPrice)}</span>,
    },
    {
      header: 'Exit Price',
      accessor: (item: TradePosition) => <span>{formatCurrency(item.currentPrice)}</span>,
    },
    {
      header: 'PnL %',
      accessor: (item: TradePosition) => (
        <span className={item.pnlPct >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
          {formatPercent(item.pnlPct)}
        </span>
      ),
    },
    {
      header: 'Exit Reason',
      accessor: (item: TradePosition) => (
        <span className="text-xs text-muted-foreground">{item.exitReason || 'Manual Exit'}</span>
      ),
    },
    {
      header: 'Details',
      accessor: (item: TradePosition) => (
        <button
          onClick={() => onSelectTrade(item)}
          className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-foreground cursor-pointer font-semibold"
        >
          View details
        </button>
      ),
    },
  ];

  return (
    <DataTable
      data={trades}
      columns={columns}
      keyExtractor={(item) => item.tradeId}
      emptyMessage="No historical trades found"
    />
  );
}
export default TradeHistoryTable
