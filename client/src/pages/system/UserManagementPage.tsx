import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { userService, type AdminUser } from '@/services/user.service'
import { toast } from 'sonner'
import DataTable from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  Users,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Edit,
  UserPlus,
  Search,
  Lock,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

export function UserManagementPage() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  // State controls
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Dialog Open States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isKiteOpen, setIsKiteOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  // Plaintext Password Disclosure States
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordDialogTitle, setPasswordDialogTitle] = useState('')
  const [copied, setCopied] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '', role: 'USER' })
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', role: 'USER', status: 'ACTIVE' })
  const [kiteForm, setKiteForm] = useState({ apiKey: '', apiSecret: '' })

  // Fetch Users Query
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userService.getUsers()
      const payload = (res.data as any).data ?? res.data
      return payload
    },
    enabled: currentUser?.role === 'ADMIN'
  })

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: typeof createForm) => userService.createUser(data),
    onSuccess: (res) => {
      const payload = (res.data as any).data ?? res.data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateOpen(false)
      // Open Password disclosure dialog
      setGeneratedPassword(payload.plainPassword)
      setPasswordDialogTitle('Operator Registered successfully')
      setIsPasswordOpen(true)
      toast.success('User account created!')
      setCreateForm({ fullName: '', email: '', phone: '', role: 'USER' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user')
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof editForm }) => userService.updateUser(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsEditOpen(false)
      toast.success('User updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user')
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userService.resetPassword(id),
    onSuccess: (res) => {
      const payload = (res.data as any).data ?? res.data
      setIsResetOpen(false)
      setGeneratedPassword(payload.plainPassword)
      setPasswordDialogTitle('Password Regenerated successfully')
      setIsPasswordOpen(true)
      toast.success('Temporary login password generated!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    }
  })

  const saveKiteMutation = useMutation({
    mutationFn: (data: { id: string; body: typeof kiteForm }) => userService.saveKiteCredentials(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsKiteOpen(false)
      toast.success('Zerodha Kite credentials configured successfully')
      setKiteForm({ apiKey: '', apiSecret: '' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save Kite credentials')
    }
  })

  // Role Gate check
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
        <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse mb-6">
          <Lock className="size-10" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">Administrative Gate Closed</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          This system resource contains privileged user controls and Zerodha authentication matrices. Operator role [ADMIN] is required to access.
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
          <ArrowLeft className="mr-1.5 size-4" /> Return to Dashboard
        </Button>
      </div>
    )
  }

  // Copy helper
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    toast.success('Password copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Pre-fill edits
  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user)
    setEditForm({
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    })
    setIsEditOpen(true)
  }

  const handleOpenKite = (user: AdminUser) => {
    setSelectedUser(user)
    setKiteForm({
      apiKey: user.kiteCredentials?.apiKey || '',
      apiSecret: user.kiteCredentials?.apiSecret || ''
    })
    setIsKiteOpen(true)
  }

  const handleOpenReset = (user: AdminUser) => {
    setSelectedUser(user)
    setIsResetOpen(true)
  }

  // Table Setup
  const usersList = Array.isArray(usersData) ? usersData : []
  const filteredUsers = usersList.filter(user => {
    const q = searchQuery.toLowerCase()
    return (
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phone && user.phone.includes(q))
    )
  })

  // Telemetry aggregates
  const totalUsers = usersList.length
  const activeUsers = usersList.filter(u => u.status === 'ACTIVE').length
  const kiteConfigured = usersList.filter(u => u.kiteCredentials && u.kiteCredentials.apiKey).length

  // Avatar Initials Helper
  const getInitials = (name: string) => {
    if (!name) return 'OP'
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  // Random color based on initials
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const columns = [
    {
      header: 'Operator',
      accessor: (item: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className={`size-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(item.fullName)}`}>
            {getInitials(item.fullName)}
          </div>
          <div>
            <span className="font-semibold text-foreground block leading-tight">{item.fullName}</span>
            <span className="text-xs text-muted-foreground block">{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone Contact',
      accessor: (item: AdminUser) => (
        <span className="text-muted-foreground font-mono text-xs">{item.phone || 'N/A'}</span>
      ),
    },
    {
      header: 'Security Role',
      accessor: (item: AdminUser) => (
        <Badge variant={item.role === 'ADMIN' ? 'success' : 'info'}>
          {item.role}
        </Badge>
      ),
    },
    {
      header: 'System Status',
      accessor: (item: AdminUser) => (
        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'danger'}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: 'Kite Broker Config',
      accessor: (item: AdminUser) => {
        const hasKeys = item.kiteCredentials && item.kiteCredentials.apiKey
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant={hasKeys ? 'success' : 'warning'} className="w-fit">
              {hasKeys ? 'Keys configured' : 'No API settings'}
            </Badge>
            {hasKeys && item.kiteCredentials?.updatedAt && (
              <span className="text-[10px] text-muted-foreground">
                Set: {new Date(item.kiteCredentials.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Actions',
      accessor: (item: AdminUser) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            title="Configure Zerodha keys"
            onClick={() => handleOpenKite(item)}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <KeyRound className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Edit Details"
            onClick={() => handleOpenEdit(item)}
            className="hover:bg-blue-500/10 hover:text-blue-500"
          >
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Regenerate Login Key"
            onClick={() => handleOpenReset(item)}
            className="hover:bg-rose-500/10 hover:text-rose-500"
          >
            <ShieldAlert className="size-3.5" />
          </Button>
        </div>
      ),
      className: 'w-[120px] text-right',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Upper Control Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">User & Credentials Registry</h2>
          <p className="text-sm text-muted-foreground">Configure operators, secure system keys, and generate broker login parameters.</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-1.5 shadow-md"
        >
          <UserPlus className="size-4" /> Add System Operator
        </Button>
      </div>

      {/* Analytics widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Registered Accounts"
          value={isLoading ? '...' : totalUsers}
          subValue="Dashboard accounts"
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="Active Platforms"
          value={isLoading ? '...' : activeUsers}
          subValue="Active trading agents"
          icon={<UserCheck className="size-5 text-emerald-500" />}
        />
        <StatCard
          title="Zerodha Connectors"
          value={isLoading ? '...' : kiteConfigured}
          subValue="Brokers integrated"
          icon={<KeyRound className="size-5 text-blue-500" />}
        />
      </div>

      {/* Filter and Grid Area */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        {/* Filters */}
        <div className="flex items-center max-w-sm relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
          <Input
            placeholder="Search operators by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Dynamic Table State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner />
            <span className="text-sm text-muted-foreground">Hydrating database registry...</span>
          </div>
        ) : error ? (
          <div className="py-12 border border-dashed border-rose-500/20 bg-rose-500/5 text-rose-500 rounded-xl text-center">
            <p className="font-semibold text-sm">Failed to retrieve operators registry</p>
            <p className="text-xs mt-1 text-muted-foreground">Is the API backend responding?</p>
          </div>
        ) : (
          <DataTable
            data={filteredUsers}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyMessage="No matching operator found in this database instance."
          />
        )}
      </div>

      {/* ========================================================
          DIALOUGES / MODALS IMPLEMENTATION
         ======================================================== */}

      {/* 1. Add Operator Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border">
          <DialogHeader>
            <DialogTitle>Register System Operator</DialogTitle>
            <DialogDescription>
              Create a new account. The system will cryptographically generate a temporary login key.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createUserMutation.mutate(createForm)
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                required
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="operator@zerothinking.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="e.g. +91 9999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Security Authorization Role</Label>
              <select
                id="role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input/30"
              >
                <option value="USER" className="bg-popover text-foreground">Standard User</option>
                <option value="ADMIN" className="bg-popover text-foreground">Super Administrator</option>
              </select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Generating credentials...' : 'Register Operator'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Plaintext Password Disclosure Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <UserCheck className="size-5" /> {passwordDialogTitle}
            </DialogTitle>
            <DialogDescription>
              A cryptographically secure temporary login password has been generated for the account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 flex items-start gap-2.5 text-amber-500 text-xs leading-relaxed">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Important Security Notice:</span>
                This temporary password is only displayed in plaintext once. Copy and share it securely. The system stores the key hashed in the database.
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Generated temporary Password</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted p-2.5 rounded-lg font-mono text-center text-lg select-all border border-border font-bold tracking-wide text-foreground">
                  {generatedPassword}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Copy password"
                  onClick={handleCopy}
                  className="size-11 shrink-0"
                >
                  {copied ? <Check className="size-4 text-emerald-500 animate-scale" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-muted/30">
            <DialogClose asChild>
              <Button variant="default" className="w-full">
                I have securely saved the Password
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Edit Operator Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border">
          <DialogHeader>
            <DialogTitle>Modify Operator Profile</DialogTitle>
            <DialogDescription>
              Update basic system configuration details for {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (selectedUser) {
                updateUserMutation.mutate({ id: selectedUser.id, body: editForm })
              }
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="e.g. +91 9999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Security Authorization Role</Label>
              <select
                id="editRole"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input/30"
              >
                <option value="USER" className="bg-popover text-foreground">Standard User</option>
                <option value="ADMIN" className="bg-popover text-foreground">Super Administrator</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Operator Status</Label>
              <select
                id="editStatus"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input/30"
              >
                <option value="ACTIVE" className="bg-popover text-foreground">Active</option>
                <option value="SUSPENDED" className="bg-popover text-foreground">Suspended</option>
              </select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Saving details...' : 'Save Profile Details'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Kite Configuration Dialog */}
      <Dialog open={isKiteOpen} onOpenChange={setIsKiteOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border">
          <DialogHeader>
            <DialogTitle>Zerodha Kite Broker Keys</DialogTitle>
            <DialogDescription>
              Configure Zerodha Kite API keys and API secrets for {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (selectedUser) {
                saveKiteMutation.mutate({ id: selectedUser.id, body: kiteForm })
              }
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="apiKey">Kite API Key</Label>
              <Input
                id="apiKey"
                required
                value={kiteForm.apiKey}
                onChange={(e) => setKiteForm({ ...kiteForm, apiKey: e.target.value })}
                placeholder="Enter Zerodha API Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">Kite API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                required
                value={kiteForm.apiSecret}
                onChange={(e) => setKiteForm({ ...kiteForm, apiSecret: e.target.value })}
                placeholder="Enter Zerodha API Secret"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsKiteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveKiteMutation.isPending}>
                {saveKiteMutation.isPending ? 'Connecting...' : 'Save Keys'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Password Reset / Regenerate Confirmation Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md bg-popover border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="size-5 animate-pulse" /> Force Password Regeneration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the password for {selectedUser?.fullName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs leading-relaxed text-muted-foreground bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground block">Warning:</span>
              The active operator's login password will be invalidated immediately. They will be disconnected if currently logged in, and must use the new generated temporary password.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  resetPasswordMutation.mutate(selectedUser.id)
                }
              }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Regenerating...' : 'Regenerate login Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagementPage
