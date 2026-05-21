// Custom hook for managing state and querying active trade positions and holdings
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../config/queryKeys'
import { positionService } from '../services/position.service'
import { usePositionStore } from '../store/usePositionStore'

export function useTradeState() {
  const { positions, updatePosition, closePosition } = usePositionStore();

  const positionsQuery = useQuery({
    queryKey: QUERY_KEYS.POSITIONS,
    queryFn: async () => {
      const response = await positionService.getPositions();
      return response.data;
    },
  });

  return {
    positions,
    isLoading: positionsQuery.isLoading,
    error: positionsQuery.error,
    refetch: positionsQuery.refetch,
    updatePosition,
    closePosition,
  };
}
