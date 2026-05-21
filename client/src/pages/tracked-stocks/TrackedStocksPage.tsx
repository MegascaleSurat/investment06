// Tracked stocks list page for observing current stock pricing, volume ratios, and indicators
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../config/queryKeys'
import { marketService } from '../../services/market.service'
import DataTable from '../../components/ui/DataTable'
import TrackedStockRow from './TrackedStockRow'
import Spinner from '../../components/ui/Spinner'

export function TrackedStocksPage() {
  const { data: stocks, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.TRACKED_STOCKS,
    queryFn: async () => {
      const response = await marketService.getTrackedStocks();
      return response.data;
    },
  });

  const columns = [
    {
      header: 'Stock',
      accessor: (item: any) => <span className="font-bold">{item.stockCode}</span>,
    },
    {
      header: 'Price Change %',
      accessor: (item: any) => (
        <span className={item.priceChangePct >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
          {item.priceChangePct >= 0 ? '+' : ''}{item.priceChangePct.toFixed(2)}%
        </span>
      ),
    },
    {
      header: '10d Avg Volume',
      accessor: (item: any) => <span>{item.avg10dVolume.toLocaleString()}</span>,
    },
    {
      header: 'Volume Ratio',
      accessor: (item: any) => <span>{item.volumeRatio.toFixed(2)}x</span>,
    },
    {
      header: 'Range (L-H) %',
      accessor: (item: any) => <span>{item.holdingRangePct.toFixed(2)}%</span>,
    },
    {
      header: 'Status',
      accessor: (item: any) => <TrackedStockRow stock={item} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Tracked Stocks</h2>
        <p className="text-sm text-muted-foreground">List of active watchlists and system validation metrics</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch tracked stocks metrics
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <DataTable
            data={stocks || []}
            columns={columns}
            keyExtractor={(item) => item.stockCode}
            emptyMessage="No stocks currently being tracked. Upload a watchlist first."
          />
        </div>
      )}
    </div>
  );
}
export default TrackedStocksPage
