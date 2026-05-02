import type { UsersListQuery } from "@/services/users.service"

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (query: UsersListQuery) => [...usersKeys.lists(), query] as const,
} as const

