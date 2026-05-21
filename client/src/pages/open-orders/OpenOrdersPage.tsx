// Open orders dashboard page monitoring order entries, side choices and quantities
import React from 'react'
import { useOrderStatus } from '../../hooks/useOrderStatus'
import DataTable from '../../components/ui/DataTable'
import OrderStatusChip from './OrderStatusChip'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { ListOrdered } from 'lucide-react'
import type { TradeOrder } from '../../types/order.types'
import { formatDate } from '../../utils/formatters'

export function OpenOrdersPage() {
  const { orders, isLoading, error } = useOrderStatus();

  const columns = [
    {
      header: 'Stock',
      accessor: (item: TradeOrder) => <span className="font-bold">{item.stockCode}</span>,
    },
    {
      header: 'Side',
      accessor: (item: TradeOrder) => (
        <span className={`font-semibold ${item.side === 'BUY' ? 'text-blue-500' : 'text-rose-500'}`}>
          {item.side}
        </span>
      ),
    },
    {
      header: 'Requested Qty',
      accessor: (item: TradeOrder) => <span>{item.requestedQty}</span>,
    },
    {
      header: 'Filled Qty',
      accessor: (item: TradeOrder) => <span>{item.filledQty}</span>,
    },
    {
      header: 'Created At',
      accessor: (item: TradeOrder) => <span>{formatDate(item.createdAt)}</span>,
    },
    {
      header: 'Status',
      accessor: (item: TradeOrder) => <OrderStatusChip status={item.orderStatus} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Open Orders</h2>
        <p className="text-sm text-muted-foreground">Monitor orders executing on broker exchanges</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch open order states
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Open Orders"
          message="There are no active trade orders pending execution."
          icon={<ListOrdered size={40} />}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <DataTable
            data={orders}
            columns={columns}
            keyExtractor={(item) => item.tradeId}
          />
        </div>
      )}
    </div>
  );
}
export default OpenOrdersPage
