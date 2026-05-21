// Custom hook for tracking and evaluating real-time relative volume spikes and slot ratios
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analytics.service'

export function useVolumeSignal() {
  const volumeQuery = useQuery({
    queryKey: ['volume-signals'],
    queryFn: async () => {
      const response = await analyticsService.getVolumeIntelligence();
      return response.data;
    },
  });

  return {
    volumeData: volumeQuery.data,
    isLoading: volumeQuery.isLoading,
    error: volumeQuery.error,
    refetch: volumeQuery.refetch,
  };
}
