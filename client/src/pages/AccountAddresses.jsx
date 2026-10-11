import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import EmptyState from '../components/shared/EmptyState';

const emptyForm = { label: '', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' };

export default function AccountAddresses() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/account/addresses'),
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/account/addresses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/account/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="account-heading !mb-0">Addresses</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="text-sm underline underline-offset-4">
          {showForm ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="max-w-xl space-y-4 mb-10 border border-border p-6 sm:p-8"
        >
          <label className="block text-sm">Label <span className="text-muted">(for example, Home)</span><input value={form.label} onChange={(e) => updateField('label', e.target.value)} className="form-field mt-2" /></label>
          <label className="block text-sm">Full name *<input required autoComplete="name" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="form-field mt-2" /></label>
          <label className="block text-sm">Phone *<input required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="form-field mt-2" /></label>
          <label className="block text-sm">Address line 1 *<input required autoComplete="address-line1" value={form.line1} onChange={(e) => updateField('line1', e.target.value)} className="form-field mt-2" /></label>
          <label className="block text-sm">Address line 2 <span className="text-muted">(optional)</span><input autoComplete="address-line2" value={form.line2} onChange={(e) => updateField('line2', e.target.value)} className="form-field mt-2" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">City *<input required autoComplete="address-level2" value={form.city} onChange={(e) => updateField('city', e.target.value)} className="form-field mt-2" /></label><label className="block text-sm">State *<input required autoComplete="address-level1" value={form.state} onChange={(e) => updateField('state', e.target.value)} className="form-field mt-2" /></label></div>
          <label className="block text-sm">Postal code *<input required inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className="form-field mt-2" /></label>
          <button type="submit" disabled={createMutation.isPending} className="store-button border border-ink bg-ink text-background disabled:opacity-50">
            {createMutation.isPending ? 'Saving…' : 'Save address'}
          </button>
          {createMutation.isError && <p role="alert" className="text-sm text-red-700">{createMutation.error.message}</p>}
        </form>
      )}

      {isLoading && <LoadingSkeleton className="h-32" />}
      {addresses && !addresses.length && <EmptyState message="No saved addresses yet." />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses?.map((addr) => (
          <div key={addr.id} className="border border-border p-5 text-sm">
            {addr.label && <p className="font-medium">{addr.label}</p>}
            <p>{addr.fullName}</p>
            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
            <p>{addr.phone}</p>
            <button onClick={() => deleteMutation.mutate(addr.id)} className="text-xs text-muted underline mt-2">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
