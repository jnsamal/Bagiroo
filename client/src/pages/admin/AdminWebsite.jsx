import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminField from '../../components/admin/AdminField';
import { majorInputToMinor, minorToMajorInput } from '../../lib/money';
import { AdminError, AdminLoading } from '../../components/admin/AdminAsyncState';

const GROUP_HELP = {
  Brand: 'Store name, logo and the description used by search engines.',
  Appearance: 'Colours and typography used throughout the storefront.',
  Navigation: 'Links customers use to move around the website.',
  Homepage: 'Main banner, headings and promotional homepage content.',
  'Homepage sections': 'Choose which content sections are visible on the homepage.',
  Footer: 'Footer headings, descriptions and destination links.',
  'Pages and policies': 'Contact information, policies, shipping text and store locations.',
  Checkout: 'Shipping charges, free-shipping rules and tax settings.',
};

const MONEY_FIELDS = {
  shippingMinor: 'Flat shipping charge (₹)',
  freeShippingThresholdMinor: 'Free shipping threshold (₹; enter 0 to disable)',
};

export default function AdminWebsite() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(null);
  const [savedValues, setSavedValues] = useState(null);
  const [group, setGroup] = useState('Brand');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-website'],
    queryFn: () => api.get(`/admin/website?fresh=${Date.now()}`),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  useEffect(() => { if (data) { setValues(data.values); setSavedValues(data.values); } }, [data]);
  const save = useMutation({ mutationFn: () => api.patch('/admin/website', values), onSuccess: saved => { setValues(saved); setSavedValues(saved); ['admin-website', 'settings', 'homepage', 'cart', 'checkout-validate'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); } });
  if (isLoading) return <AdminLoading message="Loading website settings…" />;
  if (isError) return <AdminError message={error.message} onRetry={refetch} />;
  const groups = [...new Set(data.fields.map(field => field[4]))];
  const hasUnsavedChanges = JSON.stringify(values) !== JSON.stringify(savedValues);
  return <div>
    <h1 className="section-title">Website editor</h1><p className="text-muted text-sm mt-3 mb-8">Manage branding, homepage content, visible sections, policies and checkout settings.</p>
    <label className="mb-6 block sm:hidden"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.16em] text-muted">Editing section</span><select value={group} onChange={event => setGroup(event.target.value)} className="admin-input bg-white">{groups.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
    <div className="mb-8 hidden flex-wrap gap-2 sm:flex" role="group" aria-label="Website settings sections">{groups.map(name => <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)} className={`border px-4 py-2 text-sm transition-colors ${group === name ? 'border-ink bg-ink text-background' : 'border-border bg-white hover:border-ink'}`}>{name}</button>)}</div>
    {values && <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="admin-panel">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Website section</p><h2 className="mt-1 text-xl font-semibold">{group}</h2><p className="mt-2 text-sm text-muted">{GROUP_HELP[group] || 'Manage the settings in this section.'}</p></div><span role="status" className={`inline-flex items-center gap-2 text-xs font-medium ${hasUnsavedChanges ? 'text-amber-700' : 'text-green-700'}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-green-600'}`} />{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}</span></div>
      <div className="grid sm:grid-cols-2 gap-5">{data.fields.filter(field => field[4] === group && field[0] !== 'heroImage').map(field => {
        const key = field[0];
        const isMoney = Boolean(MONEY_FIELDS[key]);
        const displayField = isMoney ? field.map((part, index) => index === 1 ? MONEY_FIELDS[key] : index === 5 || index === 6 ? part / 100 : part) : field;
        const displayValue = isMoney ? minorToMajorInput(values[key]) : values[key];
        return <AdminField key={key} field={displayField} value={displayValue} onChange={value => {
          save.reset();
          setValues(current => ({ ...current, [key]: isMoney ? (value === '' ? '' : majorInputToMinor(value)) : value }));
        }} />;
      })}</div>
      <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 items-center"><button className="admin-primary" disabled={save.isPending || !hasUnsavedChanges}>{save.isPending ? 'Saving…' : 'Save website changes'}</button><a href="/" target="_blank" rel="noreferrer" className="text-sm underline">Preview website ↗</a></div>
      {save.isError && <p role="alert" className="text-red-700 text-sm mt-4">{save.error.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm mt-4">Website changes saved.</p>}
    </form>}
  </div>;
}
