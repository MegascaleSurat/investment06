// Broker connection page managing connection credentials and checking active bridge state
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { brokerService } from '../../services/broker.service'
import StatusDot from '../../components/ui/StatusDot'
import Spinner from '../../components/ui/Spinner'

export function BrokerConnectionPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [connecting, setConnecting] = useState(false);

  const { data: connection, refetch, isLoading } = useQuery({
    queryKey: ['broker-connection-status'],
    queryFn: async () => {
      const response = await brokerService.getConnectionStatus();
      return response.data || { status: 'DISCONNECTED', brokerName: 'Zerodha Kite' };
    },
  });

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      await brokerService.connectBroker({ apiKey, apiSecret });
      refetch();
    } catch (err) {
      // Mock update for skeleton
      refetch();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Broker Connection</h2>
        <p className="text-sm text-muted-foreground">Manage exchange API credentials and check connection status</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 h-fit space-y-4">
          <h3 className="text-sm font-bold text-foreground">Credentials Form</h3>
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={connecting}
              className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Linking API...' : 'Establish Connection'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">Link Status</h3>
            {isLoading ? (
              <Spinner size="md" />
            ) : (
              <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-xl border border-border">
                <StatusDot status={connection?.status === 'CONNECTED' ? 'active' : 'error'} />
                <div>
                  <h4 className="text-sm font-bold text-foreground">{connection?.brokerName}</h4>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">Status: {connection?.status?.toLowerCase()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default BrokerConnectionPage
