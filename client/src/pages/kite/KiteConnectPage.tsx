import React from "react"
import { useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

import { useKiteDisconnect, useKiteLogin, useKiteSaveCredentials, useKiteStatus } from "@/features/kite/kite.hooks"

type UiState = "idle" | "connecting" | "connected" | "expired" | "failed"

const credsSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
})

type CredsValues = z.infer<typeof credsSchema>

export default function KiteConnectPage() {
  const [params] = useSearchParams()
  const login = useKiteLogin()
  const status = useKiteStatus()
  const disconnect = useKiteDisconnect()
  const saveCreds = useKiteSaveCredentials()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CredsValues>({
    defaultValues: { apiKey: "", apiSecret: "" },
  })

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

  const success = params.get("success")
  const error = params.get("error")

  const handleConnect = () => {
    login.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url
      },
      onError: () => {
        toast.error("Missing/invalid Zerodha app credentials. Please save API key and secret first.")
      },
    })
  }

  const handleDisconnect = async () => {
    await disconnect.mutateAsync()
  }

  const onSaveCredentials = handleSubmit(async (values) => {
    const parsed = credsSchema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please fix the form errors.")
      return
    }

    try {
      await saveCreds.mutateAsync(parsed.data)
      toast.success("Credentials saved. You can now connect Zerodha.")
      reset({ apiKey: parsed.data.apiKey, apiSecret: "" })
    } catch {
      toast.error("Failed to save credentials")
    }
  })

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Card className="w-full max-w-xl bg-white border">
        <CardHeader>
          <CardTitle className="text-slate-900">Connect Zerodha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSaveCredentials}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="apiKey">Kite API Key</FieldLabel>
                <Input id="apiKey" placeholder="your_api_key" autoComplete="off" {...register("apiKey")} />
                {errors.apiKey ? (
                  <FieldDescription className="text-destructive">{errors.apiKey.message}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="apiSecret">Kite API Secret</FieldLabel>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="your_api_secret"
                  autoComplete="off"
                  {...register("apiSecret")}
                />
                {errors.apiSecret ? (
                  <FieldDescription className="text-destructive">{errors.apiSecret.message}</FieldDescription>
                ) : (
                  <FieldDescription>
                    Stored encrypted in the backend. Not saved in the browser.
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" variant="outline" disabled={isSubmitting || saveCreds.isPending}>
                  {isSubmitting || saveCreds.isPending ? "Saving..." : "Save credentials"}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {success ? (
            <Alert>
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription>Your Zerodha account is connected.</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription>
                {error === "missing_token"
                  ? "Missing request token from Zerodha."
                  : error === "callback_failed"
                    ? "Callback failed. Please try again."
                    : "Something went wrong."}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              {uiState === "connected" ? (
                <p className="text-emerald-600 font-medium">Connected to Zerodha</p>
              ) : uiState === "expired" ? (
                <p className="text-amber-600 font-medium">Session expired — reconnect required</p>
              ) : uiState === "failed" ? (
                <p className="text-red-600 font-medium">Unable to verify connection</p>
              ) : (
                <p className="text-slate-600 font-medium">Not connected</p>
              )}
              <p className="text-sm text-slate-500">
                Access tokens expire daily. You may need to reconnect each day before trading.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleConnect} disabled={uiState === "connecting"}>
                {uiState === "connecting" ? "Redirecting..." : uiState === "connected" ? "Reconnect" : "Connect Zerodha"}
              </Button>
              {uiState === "connected" || uiState === "expired" ? (
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnect.isPending || login.isPending}
                >
                  {disconnect.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
