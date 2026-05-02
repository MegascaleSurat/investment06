import React from "react"
import { toast } from "sonner"
import { CheckCircle2, MoreHorizontal, Shield, User as UserIcon, XCircle } from "lucide-react"

import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import { Skeleton } from "../../../components/ui/skeleton"

import { useToggleUserStatus, useUsers } from "@/features/users/hooks"
import type { SafeUser, UserRole, UserStatus } from "@/services/auth.service"

const STATUS_OPTIONS: Array<{ label: string; value: UserStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Deleted", value: "DELETED" },
]

const ROLE_OPTIONS: Array<{ label: string; value: UserRole | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Admin", value: "ADMIN" },
  { label: "User", value: "USER" },
  { label: "Sub Admin", value: "SUB_ADMIN" },
]

export default function UsersManagementPage() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  const [role, setRole] = React.useState<UserRole | "ALL">("ALL")
  const [status, setStatus] = React.useState<UserStatus | "ALL">("ALL")
  const [search, setSearch] = React.useState("")

  const query = React.useMemo(
    () => ({
      page,
      limit,
      role: role === "ALL" ? undefined : role,
      status: status === "ALL" ? undefined : status,
    }),
    [limit, page, role, status]
  )

  const usersQuery = useUsers(query)
  const toggleStatus = useToggleUserStatus()

  const filteredUsers = React.useMemo(() => {
    const users = usersQuery.data?.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [search, usersQuery.data])

  const meta = usersQuery.data?.meta

  const handleStatusToggle = async (user: SafeUser) => {
    const nextStatus: UserStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    try {
      await toggleStatus.mutateAsync({ id: user.id, status: nextStatus })
      toast.success(`User status updated to ${nextStatus}`)
    } catch {
      toast.error("Failed to update user status")
    }
  }

  const canPrev = page > 1
  const canNext = meta ? page * limit < meta.total : false

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage roles and permissions for all registered users.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-72 bg-white"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1)
              if (v === "ALL" || v === "ACTIVE" || v === "SUSPENDED" || v === "DELETED") setStatus(v)
            }}
          >
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={role}
            onValueChange={(v) => {
              setPage(1)
              if (v === "ALL" || v === "ADMIN" || v === "USER" || v === "SUB_ADMIN") setRole(v)
            }}
          >
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${limit}`}
            onValueChange={(v) => {
              setPage(1)
              setLimit(Number(v))
            }}
          >
            <SelectTrigger className="w-28 bg-white">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={`${n}`}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredUsers.length ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="font-medium text-slate-900">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === "ADMIN"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }
                    >
                      {user.role === "ADMIN" ? <Shield className="h-3 w-3 mr-1" /> : null}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : user.status === "SUSPENDED"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      }
                    >
                      {user.status === "ACTIVE" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
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
                        <DropdownMenuItem
                          disabled={toggleStatus.isPending || user.status === "DELETED"}
                          onClick={() => handleStatusToggle(user)}
                        >
                          {user.status === "ACTIVE" ? "Suspend User" : "Activate User"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {meta ? (
            <>
              Page <span className="font-medium">{meta.page}</span> ·{" "}
              <span className="font-medium">{meta.total}</span> total users
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!canPrev || usersQuery.isFetching} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" disabled={!canNext || usersQuery.isFetching} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
