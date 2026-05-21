// Service managing order executions, status updates and cancel triggers
import api from './api'
import type { TradeOrder } from '../types/order.types'

export const orderService = {
  getOpenOrders: () => api.get<TradeOrder[]>('/orders/open'),
  placeOrder: (payload: Partial<TradeOrder>) => api.post('/orders', payload),
  getOrderById: (id: string) => api.get<TradeOrder>(`/orders/${id}`),
  cancelOrder: (id: string) => api.delete(`/orders/${id}`),
}
