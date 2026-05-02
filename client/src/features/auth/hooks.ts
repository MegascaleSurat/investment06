import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDispatch, useSelector } from "react-redux"

import { authKeys } from "@/features/auth/queryKeys"
import * as authService from "@/services/auth.service"
import { decodeJwtPayload } from "@/utils/jwt"
import type { RootState } from "@/app/store"
import { logout as logoutAction, setAuth } from "@/app/authSlice"

export function useLogin() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: authService.LoginInput) => authService.login(input),
    onSuccess: (res) => {
      const token = res.data.token
      const payload = decodeJwtPayload<{ roles?: authService.UserRole; email?: string; sub?: string }>(
        token
      )
      dispatch(
        setAuth({
          token,
          user: payload?.sub ? { id: payload.sub, email: payload.email ?? "", role: payload.roles ?? "USER" } : null,
        })
      )
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: authService.RegisterInput) => authService.register(input),
  })
}

export function useMe() {
  const token = useSelector((s: RootState) => s.auth.token)

  return useQuery({
    queryKey: authKeys.me(),
    enabled: !!token,
    queryFn: () => authService.me(),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: authService.UpdateProfileInput) => authService.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: authService.ChangePasswordInput) => authService.changePassword(input),
  })
}

export function useLogout() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return () => {
    dispatch(logoutAction())
    queryClient.clear()
  }
}

