// Risk controls page for setting safety limits, drawdowns, and market filters
import React, { useState } from 'react'

export function RiskControlsPage() {
  const [maxDrawdown, setMaxDrawdown] = useState(5.0);
  const [maxCapital, setMaxCapital] = useState(250000);
  const [multiplier, setMultiplier] = useState(0.5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Risk Controls</h2>
        <p className="text-sm text-muted-foreground">Configure safety locks, drawdown controls, and capital thresholds</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-6">
        <h3 className="text-sm font-bold text-foreground">Operational Safety Bounds</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Maximum Daily Loss Limit (%)</p>
              <p className="text-xs text-muted-foreground">Triggers system shutdown if daily loss exceeds limit</p>
            </div>
            <input
              type="number"
              step="0.1"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
              className="w-24 text-right rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Max Capital Per Trade (INR)</p>
              <p className="text-xs text-muted-foreground">Upper limit of allocated funds per stock ticker</p>
            </div>
            <input
              type="number"
              value={maxCapital}
              onChange={(e) => setMaxCapital(parseInt(e.target.value))}
              className="w-32 text-right rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Weak Market Qty Multiplier</p>
              <p className="text-xs text-muted-foreground">Fraction of total volume deployed when status is weak</p>
            </div>
            <input
              type="number"
              step="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-24 text-right rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button className="py-2 px-5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors cursor-pointer">
            Save Safety Gates
          </button>
        </div>
      </div>
    </div>
  );
}
export default RiskControlsPage
