// Strategy card component representing version badges and execution rule configurations
import type { StrategyConfig } from '../../types/strategy.types'
import StrategyVersionBadge from './StrategyVersionBadge'
import { Badge } from '../../components/ui/badge'

interface StrategyCardProps {
  strategy: StrategyConfig
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4 hover:shadow-xs transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-base font-bold text-foreground">{strategy.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Model type: {strategy.model}</p>
        </div>
        <StrategyVersionBadge version={strategy.version} />
      </div>

      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-muted-foreground">Status</span>
        <Badge variant={strategy.isActive ? 'success' : 'neutral'}>
          {strategy.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="flex space-x-2 pt-2">
        <button className="flex-1 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
          Edit Rules
        </button>
        <button className="py-1.5 px-3 text-xs font-semibold rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
          Clone
        </button>
      </div>
    </div>
  );
}
export default StrategyCard
