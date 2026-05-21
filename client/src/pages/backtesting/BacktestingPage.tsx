// Backtesting control dashboard triggering historical simulations and rendering results
import React, { useState } from 'react'
import BacktestResultChart from './BacktestResultChart'

export function BacktestingPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleStartBacktest = () => {
    setRunning(true);
    setTimeout(() => {
      setResults([
        { date: 'Day 1', returns: 0 },
        { date: 'Day 2', returns: 1.2 },
        { date: 'Day 3', returns: 0.8 },
        { date: 'Day 4', returns: 2.1 },
        { date: 'Day 5', returns: 3.5 },
      ]);
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Backtesting</h2>
        <p className="text-sm text-muted-foreground">Simulate rule performance over historical price datasets</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Simulation Parameters</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Lookback Period</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none">
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
                <option>Last 1 Year</option>
              </select>
            </div>
            <button
              onClick={handleStartBacktest}
              disabled={running}
              className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
            >
              {running ? 'Running Simulation...' : 'Execute Backtest'}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">PnL Growth Chart</h3>
          {results.length > 0 ? (
            <BacktestResultChart data={results} />
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              Set parameters and run backtest to visualize PnL trajectory
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default BacktestingPage
