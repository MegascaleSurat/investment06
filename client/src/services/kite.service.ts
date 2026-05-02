import axios from "@/lib/axios"

export type KiteLoginUrlResponse = { url: string }

export const getKiteLoginUrl = async () => {
  const res = await axios.get<KiteLoginUrlResponse>("/kite/login")
  return res.data
}

export type KiteUpsertCredentialsInput = {
  apiKey: string
  apiSecret: string
}

export const saveKiteCredentials = async (input: KiteUpsertCredentialsInput) => {
  const res = await axios.post<{ success: boolean }>("/kite/credentials", input)
  return res.data
}

export const handleKiteCallback = async (requestToken: string) => {
  const res = await axios.get<{ success: boolean }>("/kite/callback", {
    params: { request_token: requestToken },
  })
  return res.data
}

export const getKiteProfile = async () => {
  const res = await axios.get<{ data: unknown }>("/kite/profile")
  return res.data
}

export type KiteStatus = { connected: boolean; valid: boolean }

export const getKiteStatus = async () => {
  const res = await axios.get<{ data: KiteStatus }>("/kite/status")
  return res.data
}

export const disconnectKite = async () => {
  const res = await axios.delete<{ success: boolean }>("/kite/disconnect")
  return res.data
}
