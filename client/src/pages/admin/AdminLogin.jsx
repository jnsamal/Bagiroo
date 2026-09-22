import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function AdminLogin() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ['admin-me'], queryFn: () => api.get('/admin/me'), retry: false });
  const login = useMutation({ mutationFn: () => api.post('/admin/login', { loginId, password }), onSuccess: data => { queryClient.setQueryData(['admin-me'], data); navigate('/admin', { replace: true }); } });
  if (me) return <Navigate to="/admin" replace />;
  return <div className="min-h-screen bg-surface flex items-center justify-center px-5 py-12">
    <div className="w-full max-w-md bg-white border border-border p-8 sm:p-10">
      <img src="/images/bagiroo-logo.png" alt="Bagiroo & Co." className="w-44 h-auto mb-10" />
      <p className="text-xs uppercase tracking-widest text-muted mb-3">Store administration</p>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted mt-3 mb-8">Sign in to manage your store and website.</p>
      <form onSubmit={e => { e.preventDefault(); login.mutate(); }} className="space-y-5">
        <label className="block text-sm">Login ID<input required autoComplete="username" value={loginId} onChange={e => setLoginId(e.target.value)} className="admin-input mt-2" /></label>
        <label className="block text-sm">Password<div className="flex mt-2 border border-border"><input required autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="flex-1 min-w-0 px-3 py-3" /><button type="button" className="px-3 text-xs" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
        {login.isError && <p role="alert" className="text-sm text-red-700">{login.error.message}</p>}
        <button disabled={login.isPending} className="admin-primary w-full">{login.isPending ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <Link to="/" className="block text-sm text-muted mt-8 hover:underline">← Back to website</Link>
    </div>
  </div>;
}
