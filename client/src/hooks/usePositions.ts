import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client.ts';
import { useTradeStore } from '../stores/tradeStore.ts';

export const getPositions = async () => {
  const { data } = await apiClient.get('/api/v1/positions');
  return data;
};

export const usePositions = () => {
  const setTrades = useTradeStore((state) => state.setTrades);

  const { data: positions, isLoading, isError } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const data = await getPositions();
      setTrades(data);
      return data;
    },
    refetchInterval: 30 * 1000, // 30 seconds
  });

  return { positions, isLoading, isError };
};
