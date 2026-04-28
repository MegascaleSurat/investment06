import React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { type User, useAdminUsers, useUpdateUserStatus } from '../../../features/admin/userApi';
import { DataTable } from '../../../components/shared/DataTable';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { MoreHorizontal, Shield, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const UsersManagementPage: React.FC = () => {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStatus.mutateAsync({ id: user.id, status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-medium text-slate-900">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge className={role === 'admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}>
            {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const isActive = status === 'active';
        return (
          <Badge className={isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
            {isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-900">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                Copy User ID
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem onClick={() => handleStatusToggle(user)}>
                {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage roles and permissions for all registered users.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Add New User
        </Button>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <DataTable
          columns={columns}
          data={users}
          filterKey="name"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default UsersManagementPage;
