import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../services/apiClient"

// Deprecated: use `src/features/users/hooks.ts` + `src/services/users.service.ts` instead.

export interface User {
  id: string
  full_name: string
  email: string
  role: "ADMIN" | "USER" | "SUB_ADMIN"
  status: "ACTIVE" | "SUSPENDED" | "DELETED"
  created_at: string
}

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (filters: unknown) => [...adminUserKeys.lists(), { filters }] as const,
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUserKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      const { data } = await apiClient.get<{ data: User[] }>("/users", {
        params: { page: 1, limit: 20 },
      })
      return data.data
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" }) => {
      const { data } = await apiClient.patch(`/users/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
};
