import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client.ts';

export const getSectors = async () => {
  const { data } = await apiClient.get('/api/v1/sectors');
  return data;
};

export const useSectors = () => {
  const { data: sectors, isLoading, isError, error } = useQuery({
    queryKey: ['sectors'],
    queryFn: getSectors,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  return { sectors, isLoading, isError, error };
};
