// Side panel drawer visualizing trade details, execution logs and technical parameters
import type { TradePosition } from '../../types/trade.types'
import { Drawer } from '../../components/ui/drawer'
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters'

interface TradeDetailDrawerProps {
  trade: TradePosition | null
  isOpen: boolean
  onClose: () => void
}

export function TradeDetailDrawer({ trade, isOpen, onClose }: TradeDetailDrawerProps) {
  if (!trade) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metrics Summary</h3>
          <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl text-sm border border-border">
            <div>
              <p className="text-xs text-muted-foreground">Trade ID</p>
              <p className="font-mono text-xs truncate mt-0.5">{trade.tradeId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Holding Days</p>
              <p className="font-semibold mt-0.5">{trade.holdingDays} Days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entry Price</p>
              <p className="font-semibold mt-0.5">{formatCurrency(trade.entryPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Exit Price</p>
              <p className="font-semibold mt-0.5">{formatCurrency(trade.currentPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PnL %</p>
              <p className={`font-bold mt-0.5 ${trade.pnlPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatPercent(trade.pnlPct)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stop Loss</p>
              <p className="font-semibold mt-0.5">{formatCurrency(trade.stopLoss)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Technical Log</h3>
          <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5 text-xs font-mono">
            <p className="text-muted-foreground">[{formatDate(trade.entryDate)}] Position opened at {formatCurrency(trade.entryPrice)}</p>
            {trade.exitReason && (
              <p className="text-rose-500">[{formatDate(new Date())}] Trigger exit: {trade.exitReason}</p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
export default TradeDetailDrawer
