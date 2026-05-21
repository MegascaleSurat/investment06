// System alert notifications panel displaying active risk flags
import { useAlerts } from '../../hooks/useAlerts'
import DataTable from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Bell, Check } from 'lucide-react'
import { formatDate } from '../../utils/formatters'

export function AlertsPage() {
  const { alerts, isLoading, error, markSeen, clearAll } = useAlerts();

  const columns = [
    {
      header: 'Type',
      accessor: (item: any) => (
        <Badge variant={item.type === 'ERROR' ? 'danger' : item.type === 'WARNING' ? 'warning' : 'info'}>
          {item.type}
        </Badge>
      ),
    },
    {
      header: 'Message',
      accessor: (item: any) => (
        <span className={item.seen ? 'text-muted-foreground line-through' : 'font-semibold text-foreground'}>
          {item.message}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (item: any) => <span>{formatDate(item.timestamp)}</span>,
    },
    {
      header: 'Actions',
      accessor: (item: any) => (
        !item.seen && (
          <button
            onClick={() => markSeen(item.id)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold cursor-pointer"
          >
            <Check size={12} />
            <span>Acknowledge</span>
          </button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">System Alerts</h2>
          <p className="text-sm text-muted-foreground">Examine notifications, stop loss hits, and API failures</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAll}
            className="py-2 px-4 border border-border text-foreground hover:bg-muted font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Clear All Alerts
          </button>
        )}
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch system notifications
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Active Alerts"
          message="Your system notification panel is clean."
          icon={<Bell size={40} />}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <DataTable
            data={alerts}
            columns={columns}
            keyExtractor={(item) => item.id}
          />
        </div>
      )}
    </div>
  );
}
export default AlertsPage
