import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function AccountDetails() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });
  const [form, setForm] = useState({ name: '', phone: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (me?.user) setForm({ name: me.user.name || '', phone: me.user.phone || '' });
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
    const phone = form.phone.trim();
    mutation.mutate({ name: form.name.trim(), ...(phone ? { phone } : {}) });
  }

  return (
    <div>
      <h1 className="account-heading">Account details</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-5 border border-border p-6 sm:p-8">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => { setStatus('idle'); setForm((f) => ({ ...f, name: e.target.value })); }}
            required
            maxLength={120}
            className="form-field"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={me?.user?.email || ''}
            disabled
            className="form-field bg-surface text-muted"
          />
          <p className="text-xs text-muted mt-1">This verified email is used to sign in.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Mobile number</label>
          <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => { setStatus('idle'); setForm((f) => ({ ...f, phone: e.target.value })); }} placeholder="+91XXXXXXXXXX" pattern="\+?[1-9][0-9]{7,14}" title="Enter a valid phone number, for example +919876543210" className="form-field" />
        </div>
        <button type="submit" disabled={mutation.isPending} className="store-button border border-ink bg-ink text-background disabled:opacity-50">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        <div aria-live="polite" className="min-h-5">{status === 'saved' && <p className="text-sm text-green-700">Your account details were saved.</p>}{status === 'error' && <p role="alert" className="text-sm text-red-700">{mutation.error?.message || 'Something went wrong. Please try again.'}</p>}</div>
      </form>
    </div>
  );
}
