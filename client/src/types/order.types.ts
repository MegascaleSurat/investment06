// Type definitions representing market and limit trade orders
import { OrderSide, OrderStatus } from './enums'

export interface TradeOrder {
  tradeId: string
  stockCode: string
  side: OrderSide
  requestedQty: number
  filledQty: number
  orderStatus: OrderStatus
  brokerOrderId?: string
  createdAt: string
}
