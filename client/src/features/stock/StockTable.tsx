import React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { type Stock } from './stockApi';
import { DataTable } from '../../components/shared/DataTable';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

export const columns: ColumnDef<Stock>[] = [
  {
    accessorKey: 'symbol',
    header: 'Symbol',
    cell: ({ row }) => (
      <div className="font-bold text-white">{row.getValue('symbol')}</div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Company',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return <div className="font-mono">₹{price.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: 'changePercent',
    header: 'Change %',
    cell: ({ row }) => {
      const change = parseFloat(row.getValue('changePercent'));
      const isPositive = change >= 0;
      return (
        <Badge
          className={cn(
            "font-mono",
            isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}
        >
          {isPositive ? '+' : ''}{change}%
        </Badge>
      );
    },
  },
  {
    accessorKey: 'volume',
    header: 'Volume',
    cell: ({ row }) => {
      const volume = parseInt(row.getValue('volume'));
      return <div className="text-gray-400">{(volume / 1000000).toFixed(2)}M</div>;
    },
  },
  {
    accessorKey: 'sector',
    header: 'Sector',
    cell: ({ row }) => (
      <div className="text-xs uppercase tracking-wider text-gray-500">{row.getValue('sector')}</div>
    ),
  },
];

interface StockTableProps {
  stocks: Stock[];
  isLoading: boolean;
}

export const StockTable: React.FC<StockTableProps> = ({ stocks, isLoading }) => {
  return (
    <DataTable
      columns={columns}
      data={stocks}
      filterKey="symbol"
      isLoading={isLoading}
    />
  );
};
