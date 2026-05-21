// Status dot component displaying glowing indicators for systems, sockets, and market status
import React from 'react'

interface StatusDotProps {
  status: 'active' | 'inactive' | 'warning' | 'error'
  className?: string
}

export function StatusDot({ status, className = '' }: StatusDotProps) {
  const colors = {
    active: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    inactive: 'bg-muted-foreground/50',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    error: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  };

  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} ${className}`} />
  );
}
export default StatusDot
