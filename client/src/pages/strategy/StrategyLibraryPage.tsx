// Strategy library displaying saved configs and activation switches
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../config/queryKeys'
import { strategyService } from '../../services/strategy.service'
import StrategyCard from './StrategyCard'
import Spinner from '../../components/ui/Spinner'

export function StrategyLibraryPage() {
  const { data: strategies, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.STRATEGIES,
    queryFn: async () => {
      const response = await strategyService.getStrategies();
      return response.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Strategy Library</h2>
        <p className="text-sm text-muted-foreground">Manage active models and view saved rule configurations</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch strategies library
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(strategies ?? []).map((strat: any) => (
            <StrategyCard key={strat.id} strategy={strat} />
          ))}
        </div>
      )}
    </div>
  );
}
export default StrategyLibraryPage
