// Zustand global store for tracking and updating trade orders
import { create } from 'zustand'
import type { TradeOrder } from '../types/order.types'
import { OrderStatus } from '../types/enums'

interface OrderStore {
  orders: TradeOrder[]
  addOrder: (order: TradeOrder) => void
  updateOrderStatus: (tradeId: string, status: OrderStatus) => void
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrderStatus: (tradeId, status) => set((state) => ({
    orders: state.orders.map((o) => (o.tradeId === tradeId ? { ...o, orderStatus: status } : o)),
  })),
}))
