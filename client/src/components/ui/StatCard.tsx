// Reusable card component for displaying aggregated trading metrics and statuses
import React from 'react'

interface StatCardProps {
  title: string
  value: React.ReactNode
  subValue?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, subValue, icon, className = '' }: StatCardProps) {
  return (
    <div className={`p-5 bg-card rounded-xl border border-border shadow-2xs flex justify-between items-start transition-all duration-300 hover:shadow-xs ${className}`}>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-foreground">{value}</h4>
        {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
      </div>
      {icon && <div className="p-3 rounded-lg bg-muted/50 text-muted-foreground">{icon}</div>}
    </div>
  );
}
export default StatCard
