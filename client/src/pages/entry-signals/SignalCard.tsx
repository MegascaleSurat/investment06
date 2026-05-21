// Signal card layout showing entry price, confirmation state, and count downs
import React from 'react'
import ConfirmationTimer from '../tracked-stocks/ConfirmationTimer'
import {Badge} from '../../components/ui/badge'

interface SignalCardProps {
  signal: {
    stockCode: string
    priceChangePct: number
    volumeRatio: number
    stockStatus: string
  }
}

export function SignalCard({ signal }: SignalCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4 hover:shadow-xs transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-bold text-foreground">{signal.stockCode}</h4>
          <p className="text-xs text-muted-foreground">Volume ratio: {signal.volumeRatio.toFixed(2)}x</p>
        </div>
        <Badge variant={signal.stockStatus === 'READY' ? 'success' : 'warning'}>
          {signal.stockStatus}
        </Badge>
      </div>

      <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg text-sm">
        <span className="text-muted-foreground font-semibold">Confirmation Window</span>
        <ConfirmationTimer initialSeconds={180} />
      </div>

      <div className="flex space-x-3">
        <button className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors">
          Confirm Order
        </button>
        <button className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
          Ignore
        </button>
      </div>
    </div>
  );
}
export default SignalCard
