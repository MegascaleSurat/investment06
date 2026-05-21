// Exit engine overview page for monitoring stop loss and low volume exit checkers
import React from 'react'
import ExitRuleStatus from './ExitRuleStatus'

export function ExitEnginePage() {
  const exitRules = [
    { ruleName: 'Stop Loss Hit Check', status: 'ACTIVE' as const, description: 'Triggers exit orders when price drops below stop loss' },
    { ruleName: 'Provisional Timer Lockout', status: 'ACTIVE' as const, description: 'Cancels pending confirmation signals after 5 minutes' },
    { ruleName: 'No-Movement Exit Check (+3 days)', status: 'ACTIVE' as const, description: 'Exits positions with zero price movement within 3 days' },
    { ruleName: 'Volume Decay Exit Check', status: 'ACTIVE' as const, description: 'Triggers exit when volume ratios slide below 0.5 for 3 slots' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Exit Engine</h2>
        <p className="text-sm text-muted-foreground">Monitor real-time exit rules and portfolio tracking loops</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {exitRules.map((rule, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-foreground">{rule.ruleName}</h4>
              <ExitRuleStatus status={rule.status} />
            </div>
            <p className="text-sm text-muted-foreground">{rule.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ExitEnginePage
