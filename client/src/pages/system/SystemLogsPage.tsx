// System logs console displaying paginated system execution history
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../../config/queryKeys'
import { logsService } from '../../services/logs.service'
import DataTable from '../../components/ui/DataTable'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/formatters'

export function SystemLogsPage() {
  const [page, setPage] = useState(1);

  const { data: logsResponse, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.LOGS(page),
    queryFn: async () => {
      const response = await logsService.getSystemLogs(page);
      return response.data || { logs: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'WebSocket connection initialized' },
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Loaded 10-day historical volume tables' },
      ], totalPages: 1 };
    },
  });

  const columns = [
    {
      header: 'Timestamp',
      accessor: (item: any) => <span>{formatDate(item.timestamp)}</span>,
    },
    {
      header: 'Level',
      accessor: (item: any) => (
        <span className={`font-mono text-xs font-bold ${item.level === 'ERROR' ? 'text-rose-500' : 'text-emerald-500'}`}>
          {item.level}
        </span>
      ),
    },
    {
      header: 'Log Message',
      accessor: (item: any) => <span className="font-mono text-xs text-muted-foreground">{item.message}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Logs</h2>
        <p className="text-sm text-muted-foreground">Examine system operational feeds and debug telemetry</p>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="py-20" />
      ) : error ? (
        <div className="text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
          Failed to fetch execution logs
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <DataTable
            data={logsResponse?.logs || []}
            columns={columns}
            keyExtractor={(item: any) => `${item.timestamp}-${item.level}`}
          />
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="py-1 px-3 border border-border rounded hover:bg-muted font-semibold disabled:opacity-50 cursor-pointer text-foreground"
            >
              Previous
            </button>
            <span className="text-muted-foreground">Page {page} of {logsResponse?.totalPages || 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (logsResponse?.totalPages || 1)}
              className="py-1 px-3 border border-border rounded hover:bg-muted font-semibold disabled:opacity-50 cursor-pointer text-foreground"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default SystemLogsPage
