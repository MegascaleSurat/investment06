import React, { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MarketLivePage = () => {
  const { isConnected, isKiteConnected, ticksMap, subscribe, unsubscribe } = useSocket();
  const [newToken, setNewToken] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const token = parseInt(newToken);
    if (!isNaN(token)) {
      subscribe([token]);
      setNewToken("");
    }
  };

  const handleUnsubscribe = (token: number) => {
    unsubscribe([token]);
  };

  const ticks = Object.values(ticksMap);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Live</h1>
          <p className="text-muted-foreground">Real-time market data directly from Zerodha Kite.</p>
        </div>
        
        <form onSubmit={handleSubscribe} className="flex items-center gap-2">
          <Input
            placeholder="Enter Instrument Token"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            className="w-[200px]"
          />
          <Button type="submit" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Subscribe
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Socket Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )} />
              <span className="text-xl font-bold">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Kite Ticker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isKiteConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )} />
              <span className="text-xl font-bold">{isKiteConnected ? "Active" : "Inactive"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticks.length} Tokens</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Live Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isKiteConnected ? "Streaming" : "Paused"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Watch</CardTitle>
          <CardDescription>Live streaming prices for your subscribed instruments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">LTP</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">High/Low</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No active subscriptions. Add a token above to start live tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  ticks.map((tick) => {
                    const isPositive = tick.change >= 0;
                    return (
                      <TableRow key={tick.instrument_token} className="hover:bg-muted/30 transition-colors duration-200">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{tick.instrument_token}</span>
                            <span className="text-xs text-muted-foreground">INSTRUMENT</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-xl font-mono font-bold tracking-tight tabular-nums",
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            ₹{tick.last_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={cn(
                            "inline-flex items-center gap-1 font-medium",
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {tick.change?.toFixed(2)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {tick.volume?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col text-xs font-mono">
                            <span className="text-emerald-500">H: {tick.ohlc?.high?.toFixed(2)}</span>
                            <span className="text-rose-500">L: {tick.ohlc?.low?.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleUnsubscribe(tick.instrument_token)}
                            className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketLivePage;
