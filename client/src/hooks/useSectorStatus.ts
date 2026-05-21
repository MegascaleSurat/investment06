// Custom hook monitoring sector-specific breadth performance indexes and status rankings
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../config/queryKeys'
import { sectorService } from '../services/sector.service'
import { useSectorStore } from '../store/useSectorStore'

export function useSectorStatus() {
  const { sectors, setSectors } = useSectorStore();

  const sectorQuery = useQuery({
    queryKey: QUERY_KEYS.SECTORS,
    queryFn: async () => {
      const response = await sectorService.getSectors();
      if (response.data) {
        setSectors(response.data);
      }
      return response.data;
    },
  });

  return {
    sectors,
    isLoading: sectorQuery.isLoading,
    error: sectorQuery.error,
    refetch: sectorQuery.refetch,
  };
}
