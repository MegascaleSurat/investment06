// Action row and status indicators inside tracked stocks data grid
import React from 'react'
import {Badge} from '../../components/ui/badge'

interface TrackedStockRowProps {
  stock: {
    stockCode: string
    stockStatus: string
  }
}

export function TrackedStockRow({ stock }: TrackedStockRowProps) {
  const getStatusVariant = (status: string) => {
    if (status === 'READY') return 'success';
    if (status === 'BLOCKED') return 'danger';
    return 'neutral';
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={getStatusVariant(stock.stockStatus)}>
        {stock.stockStatus}
      </Badge>
    </div>
  );
}
export default TrackedStockRow
