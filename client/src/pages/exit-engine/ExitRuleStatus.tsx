// Exit rule active status badge showing loop state
import { Badge } from '../../components/ui/badge'

interface ExitRuleStatusProps {
  status: 'ACTIVE' | 'PAUSED' | 'FAILED'
}

export function ExitRuleStatus({ status }: ExitRuleStatusProps) {
  const getVariant = (s: typeof status) => {
    if (s === 'ACTIVE') return 'success';
    if (s === 'PAUSED') return 'warning';
    return 'danger';
  };

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  );
}
export default ExitRuleStatus
