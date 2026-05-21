// Custom hook for fetching general market state and connecting live stock pricing queries
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../config/queryKeys'
import { marketService } from '../services/market.service'
import { useMarketStore } from '../store/useMarketStore'

export function useMarketData() {
  const { livePrices, marketStatus, setMarketStatus } = useMarketStore();

  const marketStatusQuery = useQuery({
    queryKey: QUERY_KEYS.MARKET_STATUS,
    queryFn: async () => {
      const response = await marketService.getMarketStatus();
      if (response.data?.status) {
        setMarketStatus(response.data.status);
      }
      return response.data;
    },
  });

  return {
    marketStatus,
    livePrices,
    isLoading: marketStatusQuery.isLoading,
    error: marketStatusQuery.error,
    refetch: marketStatusQuery.refetch,
  };
}
