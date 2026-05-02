import React from "react"
import { toast } from "sonner"
import { Activity, AlertCircle, CheckCircle2, Loader2, Unplug } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useKiteLogin, useKiteStatus } from "@/features/kite/kite.hooks"

type UiState = "idle" | "connecting" | "connected" | "expired" | "failed"

export function KiteConnectBadge() {
  const login = useKiteLogin()
  const status = useKiteStatus()

  const uiState: UiState = React.useMemo(() => {
    if (login.isPending) return "connecting"
    if (status.isError) return "failed"

    const s = status.data?.data
    if (!s) return "idle"
    if (!s.connected) return "idle"
    if (s.connected && s.valid) return "connected"
    if (s.connected && !s.valid) return "expired"
    return "idle"
  }, [login.isPending, status.data, status.isError])

  const handleConnect = () => {
    if (uiState === "connected") {
      toast.info("Zerodha is already connected")
      return
    }
    
    login.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url
      },
      onError: () => {
        toast.error("Missing/invalid Zerodha app credentials. Please configure them in Kite Connect settings.")
      },
    })
  }

  if (uiState === "connected") {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer gap-1.5 py-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
        onClick={handleConnect}
        title="Connected to Zerodha Kite"
      >
        <CheckCircle2 className="size-3.5" />
        Kite Connected
      </Badge>
    )
  }

  if (uiState === "expired") {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer gap-1.5 py-1.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400"
        onClick={handleConnect}
        title="Session expired. Click to reconnect."
      >
        <AlertCircle className="size-3.5" />
        Kite Expired
      </Badge>
    )
  }

  if (uiState === "failed") {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer gap-1.5 py-1.5 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
        onClick={handleConnect}
        title="Connection failed. Click to try again."
      >
        <Unplug className="size-3.5" />
        Kite Error
      </Badge>
    )
  }

  if (uiState === "connecting") {
    return (
      <Badge variant="outline" className="gap-1.5 py-1.5 text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Connecting...
      </Badge>
    )
  }

  // idle
  return (
    <Badge 
      variant="outline" 
      className="cursor-pointer gap-1.5 py-1.5 hover:bg-muted"
      onClick={handleConnect}
      title="Click to connect Zerodha Kite"
    >
      <Activity className="size-3.5 text-muted-foreground" />
      Connect Kite
    </Badge>
  )
}
