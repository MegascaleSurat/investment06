import { useQuery } from '@tanstack/react-query';
import { getZerodhaProfile } from '@/services/zerodha.service';

/**
 * Hook to fetch and manage Zerodha profile data using React Query
 */
export const useZerodhaProfile = () => {
  return useQuery({
    queryKey: ['zerodha-profile'],
    queryFn: getZerodhaProfile,
    // Add some options like staleTime or retry if needed
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};
