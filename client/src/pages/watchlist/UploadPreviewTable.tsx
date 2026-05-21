// Watchlist upload preview table displaying stock tickers, close prices and base metrics
import React from 'react'
import DataTable from '../../components/ui/DataTable'
import { formatCurrency } from '../../utils/formatters'

interface UploadPreviewTableProps {
  data: any[]
}

export function UploadPreviewTable({ data }: UploadPreviewTableProps) {
  const columns = [
    {
      header: 'Stock Code',
      accessor: (item: any) => <span className="font-bold">{item.stockCode}</span>,
    },
    {
      header: 'Prev Close',
      accessor: (item: any) => <span>{formatCurrency(item.prevClose)}</span>,
    },
    {
      header: 'Volume',
      accessor: (item: any) => <span>{item.volume?.toLocaleString() || '-'}</span>,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(item) => item.stockCode}
      emptyMessage="Upload a CSV file to preview stocks before importing"
    />
  );
}
export default UploadPreviewTable
