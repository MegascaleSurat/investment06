// Sector metrics data table listing outperformance rankings and average volume ratios
import React from 'react'
import type { SectorMetrics } from '../../types/sector.types'
import DataTable from '../../components/ui/DataTable'
import SectorRankBadge from './SectorRankBadge'
import { Badge } from '../../components/ui/badge'
import { formatPercent } from '../../utils/formatters'

interface SectorTableProps {
  sectors: SectorMetrics[]
}

export function SectorTable({ sectors }: SectorTableProps) {
  const columns = [
    {
      header: 'Rank',
      accessor: (item: SectorMetrics) => <SectorRankBadge rank={item.rank} />,
    },
    {
      header: 'Sector Name',
      accessor: (item: SectorMetrics) => (
        <span className="font-bold text-foreground">{item.sectorName}</span>
      ),
    },
    {
      header: 'Return %',
      accessor: (item: SectorMetrics) => (
        <span className={item.sectorReturnPct >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
          {formatPercent(item.sectorReturnPct)}
        </span>
      ),
    },
    {
      header: 'Breadth %',
      accessor: (item: SectorMetrics) => <span>{item.breadthPct.toFixed(1)}%</span>,
    },
    {
      header: 'Volume Ratio',
      accessor: (item: SectorMetrics) => <span>{item.avgVolumeRatio.toFixed(2)}x</span>,
    },
    {
      header: 'Outperformance',
      accessor: (item: SectorMetrics) => <span>{formatPercent(item.outperformancePct)}</span>,
    },
    {
      header: 'Status',
      accessor: (item: SectorMetrics) => (
        <Badge
          variant={
            item.sectorStatus === 'VERY_STRONG' || item.sectorStatus === 'STRONG'
              ? 'success'
              : item.sectorStatus === 'NEUTRAL'
                ? 'warning'
                : 'danger'
          }
        >
          {item.sectorStatus.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={sectors}
      columns={columns}
      keyExtractor={(item) => item.sectorId}
      emptyMessage="No sectors data available"
    />
  );
}
export default SectorTable
