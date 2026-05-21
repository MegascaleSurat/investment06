import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { StatCard } from '../../components/ui/StatCard'
import { useMarketStore } from '../../store/useMarketStore'
import { usePositionStore } from '../../store/usePositionStore'
import { useOrderStore } from '../../store/useOrderStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useAlertStore } from '../../store/useAlertStore'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Briefcase, Eye, EyeOff, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const MAX_SLOTS = 10

const mockPnLData = Array.from({ length: 12 }, (_, i) => ({
  time: `${9 + i}:30`,
  value: Math.round((Math.sin(i * 0.5) * 5000 + (i * 300) + 1000) * 100) / 100,
}))

function getMarketBadgeVariant(status: string | undefined) {
  if (status === 'STRONG') return 'default'
  if (status === 'NEUTRAL') return 'secondary'
  return 'destructive'
}

function getMarketBadgeClass(status: string | undefined) {
  if (status === 'STRONG') return 'bg-emerald-950 text-emerald-400 border border-emerald-800'
  if (status === 'NEUTRAL') return 'bg-amber-950 text-amber-400 border border-amber-800'
  return 'bg-red-950 text-red-400 border border-red-800'
}

export function DashboardPage() {
  const { marketStatus } = useMarketStore()
  const { positions } = usePositionStore()
  const { orders } = useOrderStore()
  const { user } = useAuthStore()
  const { alerts, markSeen, clearAll } = useAlertStore()

  const [chartPeriod, setChartPeriod] = useState<'Today' | '30D'>('Today')
  const [showHiddenAlerts, setShowHiddenAlerts] = useState(false)

  const activeCount = positions.length
  const availableSlots = MAX_SLOTS - activeCount
  const unreadAlerts = alerts.filter(a => !a.seen)
  const displayAlerts = showHiddenAlerts ? alerts : unreadAlerts.slice(0, 10)

  const totalPnL = positions.reduce((sum, p) => sum + (p.pnlPct ?? 0), 0)
  const pnlIsPositive = totalPnL >= 0
  const chartColor = pnlIsPositive ? '#10b981' : '#ef4444'

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">System overview &amp; live summary</p>
        </div>
        <Badge
          variant={getMarketBadgeVariant(marketStatus)}
          className={`capitalize ${getMarketBadgeClass(marketStatus)}`}
        >
          {marketStatus ?? '--'}
        </Badge>
      </div>

      {/* Section A: Summary Stats Row — mobile-first: 2 cols → 4 cols on md */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Active Trades"
          value={activeCount}
          subValue={`Max ${MAX_SLOTS}`}
        />
        <StatCard
          title="Available Slots"
          value={availableSlots}
          className={availableSlots === 0 ? 'text-red-500' : 'text-emerald-500'}
        />
        <StatCard
          title="Open Orders"
          value={orders.length}
          subValue="Awaiting execution"
        />
        <StatCard
          title="Today P&L"
          value={
            <span className={pnlIsPositive ? 'text-emerald-500' : 'text-red-500'}>
              {pnlIsPositive ? `+${totalPnL.toFixed(2)}%` : `${totalPnL.toFixed(2)}%`}
            </span>
          }
          subValue={user?.name ?? '--'}
        />
      </div>

      {/* Section B: P&L Chart + Section C: Active Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* P&L Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>P&L Curve</CardTitle>
              <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as 'Today' | '30D')}>
                <TabsList>
                  <TabsTrigger value="Today">Today</TabsTrigger>
                  <TabsTrigger value="30D">30D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPnLData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area type="monotone" dataKey="value" stroke={chartColor} fill="url(#pnlGradient)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active Positions Strip */}
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-56 sm:h-64 overflow-y-auto px-3 pb-3">
              {positions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-sm text-muted-foreground">
                  <Briefcase className="mb-2 size-5 opacity-50" />
                  No active positions
                </div>
              )}
              <div className="flex flex-col gap-1">
                {positions.map((p) => {
                  const isPositive = (p.pnlPct ?? 0) >= 0
                  return (
                    <button
                      key={p.tradeId}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors min-h-11 w-full"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-sm font-medium truncate">{p.stockCode}</span>
                        <span className="text-xs text-muted-foreground">₹{p.entryPrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.currentPrice?.toFixed(2) ?? '--'}
                        </span>
                        <span className={`font-mono text-xs flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {isPositive ? '+' : ''}{p.pnlPct?.toFixed(2) ?? '0.00'}%
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section D: Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
            <div className="flex items-center gap-2">
              {unreadAlerts.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearAll}>
                  Mark all seen
                </Button>
              )}
              <Button size="icon-sm" variant="ghost" onClick={() => setShowHiddenAlerts(!showHiddenAlerts)}>
                {showHiddenAlerts ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Briefcase className="mb-2 size-5 opacity-50" />
              No alerts
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {displayAlerts.map((alert) => {
              const badgeClass =
                alert.type === 'ERROR'
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : alert.type === 'WARNING'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : alert.type === 'SUCCESS'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-muted text-muted-foreground'

              const time = alert.timestamp
                ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--'

              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                    alert.seen ? 'border-border/30 opacity-60' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className={`shrink-0 capitalize text-[10px] ${badgeClass}`}>
                      {alert.type.toLowerCase()}
                    </Badge>
                    <span className="truncate text-sm">{alert.message}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">{time}</span>
                    {!alert.seen && (
                      <Button size="icon-sm" variant="ghost" onClick={() => markSeen(alert.id)}>
                        <Eye className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
