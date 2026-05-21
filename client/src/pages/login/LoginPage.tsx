// Login page rendering a beautiful authentication form and syncing user credentials with the auth store
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { authService } from '../../services/auth.service'

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ email, password });
      
      // Unwrap standard API response wrap: { success: true, data: { user, accessToken } }
      const payload = res.data as any;
      const rawUser = payload.data?.user || payload.user;
      const token = payload.data?.accessToken || payload.token;

      if (!rawUser || !token) {
        throw new Error('Invalid response structure from authentication server');
      }

      // Map fullName from backend to name for useAuthStore
      const mappedUser = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.fullName || rawUser.name || 'Trader Account',
        role: rawUser.role,
      };

      login(mappedUser, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
          <p className="mt-2 text-sm text-muted-foreground">Access your automated trading dashboard</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">{error}</div>}
          <div className="space-y-4 rounded-md shadow-2xs">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default LoginPage
