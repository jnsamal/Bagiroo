import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
export default function AdminSecurity() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const save = useMutation({ mutationFn: () => { if (password !== confirmation) throw Error('Passwords do not match.'); return api.patch('/admin/password', { currentPassword, password }); }, onSuccess: () => { queryClient.removeQueries({ queryKey: ['admin-me'] }); navigate('/admin/login', { replace: true }); } });
  return <div><h1 className="section-title mb-3">Security</h1><p className="text-sm text-muted mb-8">Changing your password signs out all existing admin sessions.</p><form className="admin-panel max-w-lg space-y-5" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
    <label className="block text-sm">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="admin-input mt-2" /></label>
    <label className="block text-sm">New password (12–72 characters)<input required minLength={12} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="admin-input mt-2" /></label>
    <label className="block text-sm">Confirm new password<input required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="admin-input mt-2" /></label>
    <button className="admin-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Change password'}</button>{save.isError && <p role="alert" className="text-red-700 text-sm">{save.error.message}</p>}
  </form></div>;
}
