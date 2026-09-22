import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminField from '../../components/admin/AdminField';

export default function AdminContent({ resource: selectedResource }) {
  const params = useParams();
  const resource = selectedResource || params.resource;
  return <ContentEditor key={resource} resource={resource} />;
}
function ContentEditor({ resource }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-content', resource], queryFn: () => api.get(`/admin/content/${resource}`) });
  function refresh() { ['admin-content', 'categories', 'collections', 'admin-collections', 'products', 'product', 'homepage', 'navigation', 'videos', 'cart'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); }
  const save = useMutation({ mutationFn: () => editing ? api.patch(`/admin/content/${resource}/${editing.id}`, form) : api.post(`/admin/content/${resource}`, form), onSuccess: () => { refresh(); setForm(null); setEditing(null); } });
  const remove = useMutation({ mutationFn: id => api.delete(`/admin/content/${resource}/${id}`), onSuccess: refresh });
  function edit(item) {
    save.reset(); setEditing(item);
    setForm(Object.fromEntries(data.fields.map(([key, , type, , , options]) => [key, item?.[key] ?? (type === 'boolean' ? true : type === 'number' ? (key === 'rating' ? 5 : 0) : type === 'products' ? [] : type === 'select' ? options[0] : '')])));
  }
  if (isLoading) return <p role="status">Loading…</p>;
  if (isError) return <p role="alert">Could not load this section.</p>;
  return <div>
    <div className="flex flex-wrap gap-4 items-center justify-between mb-8"><h1 className="section-title">{data.title}</h1>{!data.editOnly && <button type="button" onClick={() => edit(null)} className="admin-primary">+ Add new</button>}</div>
    {resource === 'inventory' && <p className="text-sm text-muted mb-5">On-hand stock includes reserved units. Quantities cannot be reduced below reserved stock.</p>}
    {form && <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="admin-panel mb-8"><h2 className="text-xl font-semibold mb-6">{editing ? 'Edit' : 'Add'} {data.title.toLowerCase()}</h2><div className="grid sm:grid-cols-2 gap-5">{data.fields.map(field => <AdminField key={field[0]} field={field} value={form[field[0]]} products={data.products} onChange={value => setForm(current => ({ ...current, [field[0]]: value }))} />)}</div><div className="flex gap-4 mt-6"><button disabled={save.isPending} className="admin-primary">{save.isPending ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => setForm(null)} className="text-sm underline">Cancel</button></div>{save.isError && <p role="alert" className="text-sm text-red-700 mt-4">{save.error.message}</p>}</form>}
    {remove.isError && <p role="alert" className="text-red-700 text-sm mb-4">{remove.error.message}</p>}
    <div className="space-y-3">{data.items.map(item => <div key={item.id} className="admin-panel flex flex-wrap justify-between items-center gap-4">
      <div className="min-w-0"><p className="font-medium">{item.name || item.code || item.message || item.authorName || item.caption || item.product?.title || item.variation?.product?.title || data.products.find(product => product.id === item.productId)?.title || 'Untitled'}</p><p className="text-xs text-muted mt-1">{resource === 'contacts' ? `${item.email} · ${item.subject} · ${item.status}` : item.slug || item.url || item.variation?.sku || item.product?.sku || ''}{resource === 'inventory' ? ` · On hand: ${item.quantityAvailable} · Reserved: ${item.quantityReserved} · Sellable: ${item.quantityAvailable - item.quantityReserved}` : ''}</p>{resource === 'contacts' && <><p className="text-sm mt-3 whitespace-pre-wrap">{item.message}</p>{(item.phone || item.orderNumber) && <p className="text-xs mt-2">{item.phone ? `Phone: ${item.phone}` : ''}{item.phone && item.orderNumber ? ' · ' : ''}{item.orderNumber ? `Order: ${item.orderNumber}` : ''}</p>}<p className="text-xs text-muted mt-2">{new Date(item.createdAt).toLocaleString()}</p></>}</div>
      <div className="flex gap-4 text-sm"><button type="button" onClick={() => edit(item)} className="underline">Edit</button>{!data.editOnly && <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(item.id)} className="text-red-700 underline">Remove</button>}</div>
    </div>)}{!data.items.length && <p className="text-muted text-sm">No records yet.</p>}</div>
  </div>;
}

