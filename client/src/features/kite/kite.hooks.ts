import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import * as service from "@/services/kite.service"
import { kiteKeys } from "@/features/kite/kite.api"

export const useKiteLogin = () =>
  useMutation({
    mutationFn: service.getKiteLoginUrl,
  })

export const useKiteSaveCredentials = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: service.saveKiteCredentials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kiteKeys.all })
    },
  })
}

export const useKiteCallback = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: service.handleKiteCallback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kiteKeys.all })
    },
  })
}

export const useKiteStatus = () =>
  useQuery({
    queryKey: kiteKeys.status(),
    queryFn: service.getKiteStatus,
    retry: false,
  })

export const useKiteProfile = () =>
  useQuery({
    queryKey: kiteKeys.profile(),
    queryFn: service.getKiteProfile,
    retry: false,
  })

export const useKiteDisconnect = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: service.disconnectKite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kiteKeys.all })
    },
  })
}
