import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function AccountDetails() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (me?.user) setForm({ name: me.user.name || '', email: me.user.email || '' });
  }, [me]);

  const mutation = useMutation({
    mutationFn: (body) => api.patch('/account', body),
    onSuccess: () => {
      setStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => setStatus('error'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    mutation.mutate(form);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Account Details</h1>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Mobile number</label>
          <input value={me?.user?.phone || ''} disabled className="w-full border border-border px-3 py-2 bg-surface text-muted" />
          <p className="text-xs text-muted mt-1">Contact support to change your registered number.</p>
        </div>
        <button type="submit" className="bg-ink text-background px-6 py-3 text-sm uppercase tracking-wide">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <p className="text-sm text-green-700">Saved.</p>}
        {status === 'error' && <p className="text-sm text-red-700">Something went wrong.</p>}
      </form>
    </div>
  );
}
