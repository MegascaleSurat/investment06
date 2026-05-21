// Custom hook tracking and polling active trade orders and confirmation responses
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../config/queryKeys'
import { orderService } from '../services/order.service'
import { useOrderStore } from '../store/useOrderStore'

export function useOrderStatus() {
  const { orders, addOrder, updateOrderStatus } = useOrderStore();

  const ordersQuery = useQuery({
    queryKey: QUERY_KEYS.OPEN_ORDERS,
    queryFn: async () => {
      const response = await orderService.getOpenOrders();
      return response.data;
    },
  });

  return {
    orders,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    addOrder,
    updateOrderStatus,
  };
}
