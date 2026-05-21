// Sector ranking badge displaying custom highlights for top-performing positions
import React from 'react'

interface SectorRankBadgeProps {
  rank: number
}

export function SectorRankBadge({ rank }: SectorRankBadgeProps) {
  const styles = {
    1: 'bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold',
    2: 'bg-slate-300/15 text-slate-400 border border-slate-300/30 font-bold',
    3: 'bg-amber-700/10 text-amber-700 border border-amber-700/20 font-bold',
  };

  const badgeStyle = (styles as any)[rank] || 'bg-muted text-muted-foreground border border-border';

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${badgeStyle}`}>
      {rank}
    </span>
  );
}
export default SectorRankBadge
