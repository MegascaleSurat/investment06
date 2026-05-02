import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { useKiteCallback } from "@/features/kite/kite.hooks"

export default function KiteCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const callback = useKiteCallback()

  React.useEffect(() => {
    const token = params.get("request_token")

    if (!token) {
      navigate("/kite/connect?error=missing_token", { replace: true })
      return
    }

    callback.mutate(token, {
      onSuccess: () => {
        navigate("/kite/connect?success=1", { replace: true })
      },
      onError: () => {
        navigate("/kite/connect?error=callback_failed", { replace: true })
      },
    })
  }, [callback, navigate, params])

  return <div className="p-4">Connecting Zerodha...</div>
}

