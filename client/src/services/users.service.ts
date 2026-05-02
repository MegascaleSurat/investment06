import api from "@/lib/api"
import type { ApiSuccess, SafeUser, UserRole, UserStatus } from "@/services/auth.service"

export type UsersListQuery = {
  page: number
  limit: number
  role?: UserRole
  status?: UserStatus
}

export type UsersListResponse = ApiSuccess<SafeUser[]> & {
  meta: {
    page: number
    limit: number
    total: number
  }
}

export async function listUsers(query: UsersListQuery) {
  const { data } = await api.get<UsersListResponse>("/users", { params: query })
  return data
}

export type UpdateUserStatusInput = {
  id: string
  status: Exclude<UserStatus, "DELETED">
}

export async function updateUserStatus({ id, status }: UpdateUserStatusInput) {
  const { data } = await api.patch<ApiSuccess<SafeUser>>(`/users/${id}/status`, { status })
  return data
}

