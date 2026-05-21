// Custom hook linking alert state transitions and notification listings
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../config/queryKeys'
import { alertsService } from '../services/alerts.service'
import { useAlertStore } from '../store/useAlertStore'

export function useAlerts() {
  const { alerts, addAlert, markSeen, clearAll } = useAlertStore();

  const alertsQuery = useQuery({
    queryKey: QUERY_KEYS.ALERTS,
    queryFn: async () => {
      const response = await alertsService.getAlerts();
      return response.data;
    },
  });

  return {
    alerts,
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    refetch: alertsQuery.refetch,
    addAlert,
    markSeen,
    clearAll,
  };
}
