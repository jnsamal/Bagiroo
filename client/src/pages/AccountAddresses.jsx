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
        <h1 className="text-2xl font-semibold">Addresses</h1>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm underline">
          {showForm ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="max-w-sm space-y-3 mb-10 border border-border p-6"
        >
          <input placeholder="Label (e.g. Home)" value={form.label} onChange={(e) => updateField('label', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="Address line 1" value={form.line1} onChange={(e) => updateField('line1', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input placeholder="Address line 2" value={form.line2} onChange={(e) => updateField('line2', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="State" value={form.state} onChange={(e) => updateField('state', e.target.value)} className="w-full border border-border px-3 py-2" />
          <input required placeholder="Postal code" value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className="w-full border border-border px-3 py-2" />
          <button type="submit" className="bg-ink text-background px-6 py-2 text-sm uppercase tracking-wide">
            Save address
          </button>
        </form>
      )}

      {isLoading && <LoadingSkeleton className="h-32" />}
      {addresses && !addresses.length && <EmptyState message="No saved addresses yet." />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses?.map((addr) => (
          <div key={addr.id} className="border border-border p-4 text-sm">
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
