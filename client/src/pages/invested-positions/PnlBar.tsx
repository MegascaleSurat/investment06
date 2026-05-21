// PnL bar component displaying visual colored bar metrics for current returns
import React from 'react'
import { formatPercent } from '../../utils/formatters'

interface PnlBarProps {
  pnlPct: number
}

export function PnlBar({ pnlPct }: PnlBarProps) {
  const isPositive = pnlPct >= 0;
  const barWidth = Math.min(Math.abs(pnlPct) * 10, 100);

  return (
    <div className="flex flex-col space-y-1 w-32">
      <span className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {formatPercent(pnlPct)}
      </span>
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
export default PnlBar
