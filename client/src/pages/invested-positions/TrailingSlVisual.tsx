// Trailing stop loss visual bar displaying the gap between Stop Loss, Current Price, and Target
import React from 'react'
import type { TradePosition } from '../../types/trade.types'
import { formatCurrency } from '../../utils/formatters'

interface TrailingSlVisualProps {
  position: TradePosition
}

export function TrailingSlVisual({ position }: TrailingSlVisualProps) {
  const { currentPrice, stopLoss, currentTarget } = position;
  
  // Calculate relative position of current price between stopLoss and target
  const range = currentTarget - stopLoss;
  const progress = range > 0 ? ((currentPrice - stopLoss) / range) * 100 : 50;
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="flex flex-col space-y-1 w-44">
      <div className="flex justify-between text-4xs text-muted-foreground font-medium">
        <span>SL: {formatCurrency(stopLoss)}</span>
        <span>Target: {formatCurrency(currentTarget)}</span>
      </div>
      <div className="w-full bg-muted h-1 rounded-full relative">
        <div
          className="absolute -top-0.5 w-2 h-2 rounded-full bg-primary"
          style={{ left: `calc(${safeProgress}% - 4px)` }}
        />
      </div>
    </div>
  );
}
export default TrailingSlVisual
