import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminField from '../../components/admin/AdminField';

export default function AdminWebsite() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(null);
  const [group, setGroup] = useState('Brand');
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-website'], queryFn: () => api.get('/admin/website') });
  useEffect(() => { if (data && values === null) setValues(data.values); }, [data, values]);
  const save = useMutation({ mutationFn: () => api.patch('/admin/website', values), onSuccess: () => { ['admin-website', 'settings', 'homepage', 'cart', 'checkout-validate'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); } });
  if (isLoading) return <p role="status">Loading website settings…</p>;
  if (isError) return <p role="alert">Could not load website settings.</p>;
  const groups = [...new Set(data.fields.map(field => field[4]))];
  return <div>
    <h1 className="section-title">Website editor</h1><p className="text-muted text-sm mt-3 mb-8">Manage branding, homepage content, visible sections, policies and checkout settings.</p>
    <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Website settings sections">{groups.map(name => <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)} className={`px-4 py-2 text-sm border ${group === name ? 'bg-ink text-background border-ink' : 'border-border bg-white'}`}>{name}</button>)}</div>
    {values && <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="admin-panel">
      <h2 className="text-xl font-semibold mb-6">{group}</h2>
      <div className="grid sm:grid-cols-2 gap-5">{data.fields.filter(field => field[4] === group).map(field => <AdminField key={field[0]} field={field} value={values[field[0]]} onChange={value => { save.reset(); setValues(current => ({ ...current, [field[0]]: value })); }} />)}</div>
      <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 items-center"><button className="admin-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save website changes'}</button><a href="/" target="_blank" rel="noreferrer" className="text-sm underline">Preview website ↗</a></div>
      {save.isError && <p role="alert" className="text-red-700 text-sm mt-4">{save.error.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm mt-4">Website changes saved.</p>}
    </form>}
  </div>;
}
