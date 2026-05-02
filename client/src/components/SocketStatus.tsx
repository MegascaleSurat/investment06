import { useSocket } from "@/hooks/useSocket";
import { Badge } from "@/components/ui/badge";
import { Activity, Radio, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const SocketStatus = () => {
  const { isConnected, lastTick, ticksCount } = useSocket();

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-background/50 backdrop-blur-md border rounded-full shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isConnected ? "bg-emerald-500" : "bg-rose-500"
            )}
          ></span>
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isConnected ? "Live" : "Offline"}
        </span>
      </div>

      <div className="h-4 w-[1px] bg-border" />

      <div className="flex items-center gap-2 text-xs font-mono">
        <Activity className={cn("w-3.5 h-3.5", isConnected ? "text-blue-500 animate-pulse" : "text-muted-foreground")} />
        <span className="text-muted-foreground">Ticks:</span>
        <span className="font-bold text-foreground min-w-[3ch]">{ticksCount}</span>
      </div>

      {lastTick && (
        <>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-mono">LTP:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
              ₹{lastTick.last_price?.toFixed(2) || "0.00"}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
