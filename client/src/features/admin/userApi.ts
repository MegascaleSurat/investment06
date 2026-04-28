import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (filters: any) => [...adminUserKeys.lists(), { filters }] as const,
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUserKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      // const { data } = await apiClient.get('/admin/users');
      // return data;
      
      // Mock data
      return [
        { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: '2023-01-01' },
        { id: '2', name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', createdAt: '2023-05-15' },
        { id: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'inactive', createdAt: '2023-06-20' },
      ];
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
};
