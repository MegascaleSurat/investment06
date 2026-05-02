import api from "@/lib/api"

export type ApiSuccess<T> = {
  success: boolean
  message: string
  data: T
  meta?: unknown
}

export type UserRole = "ADMIN" | "USER" | "SUB_ADMIN"
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED"

export type SafeUser = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type RegisterInput = {
  full_name: string
  email: string
  phone?: string
  password: string
}

export async function register(input: RegisterInput) {
  const { data } = await api.post<ApiSuccess<SafeUser>>("/users/register", input)
  return data
}

export type LoginInput = {
  email: string
  password: string
}

export type LoginResponse = { token: string }

export async function login(input: LoginInput) {
  const { data } = await api.post<ApiSuccess<LoginResponse>>("/users/login", input)
  return data
}

export async function me() {
  const { data } = await api.get<ApiSuccess<SafeUser>>("/users/me")
  return data
}

export type UpdateProfileInput = {
  full_name?: string
  phone?: string | null
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await api.put<ApiSuccess<SafeUser>>("/users/me", input)
  return data
}

export type ChangePasswordInput = {
  old_password: string
  new_password: string
}

export async function changePassword(input: ChangePasswordInput) {
  const { data } = await api.put<ApiSuccess<null>>("/users/change-password", input)
  return data
}

