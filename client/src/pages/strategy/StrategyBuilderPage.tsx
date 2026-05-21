// Strategy creator page managing entry/exit block definitions and saving new templates
import React, { useState } from 'react'
import RuleBlockEditor from './RuleBlockEditor'
import type { RuleBlock, RiskParams } from '../../types/strategy.types'
import { TargetMode } from '../../types/enums'

export function StrategyBuilderPage() {
  const [name, setName] = useState('');
  const [entryRules, setEntryRules] = useState<RuleBlock[]>([]);
  const [exitRules, setExitRules] = useState<RuleBlock[]>([]);
  const [riskParams, setRiskParams] = useState<RiskParams>({
    maxCapitalPerTrade: 100000,
    stopLossPercent: 5.0,
    targetPercent: 10.0,
    targetMode: TargetMode.FIXED,
    stepPercent: 5.0,
    weakMarketQtyMultiplier: 0.5,
  });

  const handleSave = () => {
    // Save skeleton
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Strategy Builder</h2>
          <p className="text-sm text-muted-foreground">Draft and configure custom entry rules and exit thresholds</p>
        </div>
        <button
          onClick={handleSave}
          className="py-2 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
        >
          Save Strategy
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Entry Gate Rules</h3>
          <RuleBlockEditor rules={entryRules} onChange={setEntryRules} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Exit Trigger Rules</h3>
          <RuleBlockEditor rules={exitRules} onChange={setExitRules} />
        </div>
      </div>
    </div>
  );
}
export default StrategyBuilderPage
