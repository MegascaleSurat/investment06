import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { usersKeys } from "@/features/users/queryKeys"
import * as usersService from "@/services/users.service"

export function useUsers(query: usersService.UsersListQuery) {
  return useQuery<usersService.UsersListResponse>({
    queryKey: usersKeys.list(query),
    queryFn: () => usersService.listUsers(query),
    placeholderData: keepPreviousData,
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: usersService.UpdateUserStatusInput) =>
      usersService.updateUserStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}
