// Strategy version badge displaying build revisions
import React from 'react'

interface StrategyVersionBadgeProps {
  version: number
}

export function StrategyVersionBadge({ version }: StrategyVersionBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-3xs font-mono font-bold border border-blue-500/20">
      v{version.toFixed(1)}
    </span>
  );
}
export default StrategyVersionBadge
