import { useMutation, useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAuthStore, type User } from '@/store/useAuthStore'

type LoginCredentials = {
  email: string
  password: string
}

type RegisterPayload = {
  full_name: string
  email: string
  phone?: string
  password: string
}

function normalizeAuthResponse(response: any) {
  const payload = response?.data || response
  const data = payload?.data || payload
  const user = data?.user || data
  const token = data?.accessToken || data?.token || payload?.token
  return { user, token, response }
}

export function useLogin() {
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await authService.login(credentials)
      const { user, token } = normalizeAuthResponse(res)

      if (!user || !token) {
        throw new Error('Invalid login response')
      }

      const mappedUser: User = {
        id: user.id,
        email: user.email,
        name: user.fullName || user.name || 'Trader Account',
        role: user.role || 'USER',
      }

      login(mappedUser, token)
      return res
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
  })
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout)

  return () => {
    authService.logout().catch(() => undefined)
    logout()
  }
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!(localStorage.getItem('token') || localStorage.getItem('zt_token')),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
