// Entry status badge component mapping signal validation status checks to custom layouts
import { SignalStatus } from '../../types/enums'
import { Badge } from '../../components/ui/badge'

interface EntryStatusBadgeProps {
  status: SignalStatus
}

export function EntryStatusBadge({ status }: EntryStatusBadgeProps) {
  const getBadgeVariant = (s: SignalStatus) => {
    switch (s) {
      case SignalStatus.CONFIRMED_PASS:
        return 'success';
      case SignalStatus.PROVISIONAL_PASS:
        return 'info';
      case SignalStatus.WAIT:
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <Badge variant={getBadgeVariant(status)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
export default EntryStatusBadge
