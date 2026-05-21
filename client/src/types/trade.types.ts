// Type definitions representing active and historical trade positions
import { TradeStatus, TargetMode } from './enums'

export interface TradePosition {
  tradeId: string
  stockCode: string
  entryPrice: number
  currentPrice: number
  stopLoss: number
  currentTarget: number
  nextTarget: number
  pnlPct: number
  holdingDays: number
  positionStatus: TradeStatus
  targetMode: TargetMode
  stepPercent: number
  exitReason?: string
  entryDate: string
}
