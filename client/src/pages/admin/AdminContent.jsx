import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminField from '../../components/admin/AdminField';
import AdminFeedback from '../../components/admin/AdminFeedback';
import AdminStatusBadge, { adminStatusLabel } from '../../components/admin/AdminStatusBadge';
import { majorInputToMinor, minorToMajorInput } from '../../lib/money';
import { AdminError, AdminLoading } from '../../components/admin/AdminAsyncState';

const RESOURCE_GUIDANCE = {
  categories: { item: 'category', description: 'Organize products into clear groups that customers can browse.' },
  collections: { item: 'collection', description: 'Create curated product groups for menus and featured sections.' },
  inventory: { item: 'stock record', description: 'Review and update the sellable quantity for each product or colour.' },
  videos: { item: 'video', description: 'Manage the videos and linked products shown in Shop by Video.' },
  instagram: { item: 'Instagram post', description: 'Choose the social posts displayed on the storefront.' },
  announcements: { item: 'announcement', description: 'Manage messages shown in the announcement bar.' },
  contacts: { item: 'message', description: 'Read and update enquiries submitted through the contact form.' },
  reviews: { item: 'review', description: 'Approve or manage product reviews submitted by customers.' },
  coupons: { item: 'coupon', description: 'Create and manage discount codes for customers.' },
  testimonials: { item: 'customer story', description: 'Manage customer stories displayed on the homepage.' },
};

function pluralize(label) {
  if (label.endsWith('story')) return `${label.slice(0, -1)}ies`;
  if (label.endsWith('category')) return `${label.slice(0, -1)}ies`;
  return `${label}s`;
}

export default function AdminContent({ resource: selectedResource }) {
  const params = useParams();
  const resource = selectedResource || params.resource;
  return <ContentEditor key={resource} resource={resource} />;
}
function ContentEditor({ resource }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState('ALL');
  const guidance = RESOURCE_GUIDANCE[resource] || { item: 'item', description: 'Manage the content displayed in this section.' };
  const pluralItem = pluralize(guidance.item);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-content', resource], queryFn: () => api.get(`/admin/content/${resource}`) });
  function refresh() { ['admin-content', 'categories', 'collections', 'admin-collections', 'products', 'product', 'homepage', 'navigation', 'videos', 'cart'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); }
  const save = useMutation({ mutationFn: () => editing ? api.patch(`/admin/content/${resource}/${editing.id}`, form) : api.post(`/admin/content/${resource}`, form), onMutate: () => setNotice(''), onSuccess: () => { refresh(); setNotice(`${guidance.item.charAt(0).toUpperCase()}${guidance.item.slice(1)} saved successfully.`); setForm(null); setEditing(null); } });
  const remove = useMutation({ mutationFn: id => api.delete(`/admin/content/${resource}/${id}`), onMutate: () => setNotice(''), onSuccess: () => { refresh(); setNotice(`${guidance.item.charAt(0).toUpperCase()}${guidance.item.slice(1)} removed successfully.`); } });
  const moderateReview = useMutation({
    mutationFn: ({ item, approved }) => api.patch(`/admin/content/reviews/${item.id}`, {
      productId: item.productId,
      authorName: item.authorName,
      rating: item.rating,
      comment: item.comment,
      isApproved: approved,
    }),
    onMutate: () => setNotice(''),
    onSuccess: (_, variables) => { refresh(); setNotice(variables.approved ? 'Review approved and published.' : 'Review hidden from the storefront.'); },
  });
  const updateContact = useMutation({
    mutationFn: ({ item, status }) => api.patch(`/admin/content/contacts/${item.id}`, { status }),
    onMutate: () => setNotice(''),
    onSuccess: (_, variables) => { refresh(); setNotice(`Message marked as “${adminStatusLabel(variables.status)}”.`); },
  });
  function edit(item) {
    save.reset(); setEditing(item);
    setForm(Object.fromEntries(data.fields.map(([key, , type, , , options]) => [key, item?.[key] ?? (type === 'boolean' ? true : type === 'number' ? (key === 'rating' ? 5 : 0) : type === 'products' ? [] : type === 'select' ? options[0] : '')])));
  }
  function itemTitle(item) {
    return item.name || item.code || item.message || item.authorName || item.caption || item.product?.title || item.variation?.product?.title || data.products.find(product => product.id === item.productId)?.title || `this ${guidance.item}`;
  }
  function inventoryState(item) {
    const sellable = Math.max(0, item.quantityAvailable - item.quantityReserved);
    if (sellable === 0) return { label: 'Out of stock', className: 'bg-red-100 text-red-900' };
    if (sellable <= 5) return { label: 'Low stock', className: 'bg-amber-100 text-amber-900' };
    return { label: 'In stock', className: 'bg-green-100 text-green-900' };
  }
  function contentField(field) {
    const key = field[0];
    const isMinimumOrder = resource === 'coupons' && key === 'minOrderMinor';
    const isFixedDiscount = resource === 'coupons' && key === 'discountValue' && form?.discountType === 'FLAT';
    if (!isMinimumOrder && !isFixedDiscount) return { field, value: form[key], onChange: value => value };
    const displayField = field.map((part, index) => index === 0 && isFixedDiscount
      ? 'discountValueMinor'
      : index === 1 ? isMinimumOrder ? 'Minimum order value (₹)' : 'Discount amount (₹)'
        : part);
    return {
      field: displayField,
      value: minorToMajorInput(form[key]),
      onChange: value => value === '' ? '' : majorInputToMinor(value),
    };
  }
  if (isLoading) return <AdminLoading message={`Loading ${pluralItem}…`} />;
  if (isError) return <AdminError message={error.message} onRetry={refetch} />;
  const filterOptions = resource === 'reviews'
    ? [['ALL', 'All reviews'], ['PENDING', 'Awaiting approval'], ['APPROVED', 'Approved']]
    : resource === 'contacts'
      ? [['ALL', 'All messages'], ['NEW', 'New'], ['IN_PROGRESS', 'In progress'], ['RESOLVED', 'Resolved']]
      : resource === 'inventory'
        ? [['ALL', 'All stock levels'], ['OUT', 'Out of stock'], ['LOW', 'Low stock'], ['IN', 'In stock']]
        : [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = data.items.filter(item => {
    const searchable = [itemTitle(item), item.email, item.subject, item.status, item.slug, item.url, item.sku, item.comment, item.message, item.product?.sku, item.variation?.sku].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
    let matchesFilter = true;
    if (resource === 'reviews') matchesFilter = listFilter === 'ALL' || (listFilter === 'APPROVED' ? item.isApproved : !item.isApproved);
    if (resource === 'contacts') matchesFilter = listFilter === 'ALL' || item.status === listFilter;
    if (resource === 'inventory' && listFilter !== 'ALL') {
      const sellable = Math.max(0, item.quantityAvailable - item.quantityReserved);
      matchesFilter = listFilter === 'OUT' ? sellable === 0 : listFilter === 'LOW' ? sellable > 0 && sellable <= 5 : sellable > 5;
    }
    return matchesSearch && matchesFilter;
  });
  return <div>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="section-title">{data.title}</h1><p className="mt-3 max-w-2xl text-sm text-muted">{guidance.description}</p></div>{!data.editOnly && <button type="button" onClick={() => edit(null)} className="admin-primary">+ Add {guidance.item}</button>}</div>
    {resource === 'inventory' && <p className="text-sm text-muted mb-5">On-hand stock includes reserved units. Quantities cannot be reduced below reserved stock.</p>}
    <AdminFeedback>{notice}</AdminFeedback>
    {form && <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="admin-panel mb-8"><div className="mb-6 border-b border-border pb-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">{editing ? 'Editing existing content' : 'Creating new content'}</p><h2 className="mt-1 text-xl font-semibold">{editing ? 'Edit' : 'Add'} {guidance.item}</h2></div><div className="grid sm:grid-cols-2 gap-5">{data.fields.map(field => { const display = contentField(field); return <AdminField key={field[0]} field={display.field} value={display.value} products={data.products} onChange={value => setForm(current => resource === 'coupons' && field[0] === 'discountType' ? { ...current, discountType: value, discountValue: 0 } : { ...current, [field[0]]: display.onChange(value) })} />; })}</div>{resource === 'coupons' && <p className="mt-4 text-xs text-muted">Percentage discounts use a value from 0 to 100. Fixed discounts and minimum orders use rupees.</p>}<div className="flex gap-4 mt-6"><button disabled={save.isPending} className="admin-primary">{save.isPending ? 'Saving…' : `Save ${guidance.item}`}</button><button type="button" onClick={() => setForm(null)} className="border border-border bg-white px-4 py-3 text-sm hover:border-ink">Cancel</button></div>{save.isError && <p role="alert" className="text-sm text-red-700 mt-4">{save.error.message}</p>}</form>}
    {remove.isError && <p role="alert" className="text-red-700 text-sm mb-4">{remove.error.message}</p>}
    {moderateReview.isError && <p role="alert" className="text-red-700 text-sm mb-4">{moderateReview.error.message}</p>}
    {updateContact.isError && <p role="alert" className="text-red-700 text-sm mb-4">{updateContact.error.message}</p>}
    {!!data.items.length && <><div className={`mb-4 grid gap-3 ${filterOptions.length ? 'sm:grid-cols-[minmax(240px,1fr)_220px_auto]' : 'sm:grid-cols-[minmax(240px,1fr)_auto]'}`}><label className="flex border border-border bg-white focus-within:border-ink"><span className="flex items-center pl-4 text-muted" aria-hidden="true">⌕</span><span className="sr-only">Search {pluralItem}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${pluralItem}`} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /></label>{filterOptions.length > 0 && <select aria-label={`Filter ${pluralItem}`} value={listFilter} onChange={event => setListFilter(event.target.value)} className="border border-border bg-white px-3 py-3 text-sm">{filterOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}{(search || listFilter !== 'ALL') && <button type="button" onClick={() => { setSearch(''); setListFilter('ALL'); }} className="border border-border bg-white px-4 py-3 text-sm hover:border-ink">Clear filters</button>}</div><p role="status" className="mb-3 text-xs text-muted">Showing {filteredItems.length} of {data.items.length} {data.items.length === 1 ? guidance.item : pluralItem}</p></>}
    <div className="space-y-3">{filteredItems.map(item => <div key={item.id} className="admin-panel flex flex-wrap justify-between items-center gap-4">
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><p className="font-medium">{itemTitle(item)}</p>{resource === 'inventory' && <span className={`inline-flex px-2.5 py-1 text-xs font-medium ${inventoryState(item).className}`}>{inventoryState(item).label}</span>}{resource === 'contacts' && <AdminStatusBadge status={item.status} />}</div><p className="text-xs text-muted mt-1">{resource === 'contacts' ? `${item.email} · ${item.subject}` : resource === 'reviews' ? `${data.products.find(product => product.id === item.productId)?.title || 'Product'} · ${item.rating}/5 · ${item.isApproved ? 'Approved' : 'Pending approval'}` : item.slug || item.url || item.variation?.sku || item.product?.sku || ''}{resource === 'inventory' ? ` · Available to sell: ${Math.max(0, item.quantityAvailable - item.quantityReserved)} · On hand: ${item.quantityAvailable} · Reserved: ${item.quantityReserved}` : ''}</p>{resource === 'reviews' && <><p className="mt-3 whitespace-pre-wrap text-sm">{item.comment}</p><p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p></>}{resource === 'contacts' && <><p className="text-sm mt-3 whitespace-pre-wrap">{item.message}</p>{(item.phone || item.orderNumber) && <p className="text-xs mt-2">{item.phone ? `Phone: ${item.phone}` : ''}{item.phone && item.orderNumber ? ' · ' : ''}{item.orderNumber ? `Order: ${item.orderNumber}` : ''}</p>}<p className="text-xs text-muted mt-2">{new Date(item.createdAt).toLocaleString()}</p></>}</div>
      <div className="flex flex-wrap items-center gap-3 text-sm">{resource === 'reviews' && <button type="button" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ item, approved: !item.isApproved })} className={`border px-3 py-2 text-xs font-medium disabled:opacity-50 ${item.isApproved ? 'border-border bg-white hover:border-ink' : 'border-ink bg-ink text-white'}`}>{item.isApproved ? 'Hide review' : 'Approve review'}</button>}{resource === 'contacts' && item.status === 'NEW' && <button type="button" disabled={updateContact.isPending} onClick={() => updateContact.mutate({ item, status: 'IN_PROGRESS' })} className="border border-ink bg-ink px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Start working</button>}{resource === 'contacts' && item.status !== 'RESOLVED' && <button type="button" disabled={updateContact.isPending} onClick={() => updateContact.mutate({ item, status: 'RESOLVED' })} className="border border-border bg-white px-3 py-2 text-xs font-medium hover:border-ink disabled:opacity-50">Mark resolved</button>}{resource === 'contacts' && item.status === 'RESOLVED' && <button type="button" disabled={updateContact.isPending} onClick={() => updateContact.mutate({ item, status: 'NEW' })} className="border border-border bg-white px-3 py-2 text-xs font-medium hover:border-ink disabled:opacity-50">Reopen</button>}<button type="button" onClick={() => edit(item)} className="underline">Edit</button>{!data.editOnly && <button type="button" disabled={remove.isPending} onClick={() => { const confirmed = window.confirm(`Remove “${itemTitle(item)}”?\n\nThis action cannot be undone.`); if (confirmed) remove.mutate(item.id); }} className="text-red-700 underline">Remove</button>}</div>
    </div>)}{!data.items.length ? <div className="admin-panel py-10 text-center"><p className="font-medium">No {pluralItem} yet</p><p className="mx-auto mt-2 max-w-md text-sm text-muted">{data.editOnly ? 'There is nothing to review in this section right now.' : `Add the first ${guidance.item} to get started.`}</p>{!data.editOnly && <button type="button" onClick={() => edit(null)} className="admin-primary mt-5">+ Add {guidance.item}</button>}</div> : !filteredItems.length && <div className="admin-panel py-10 text-center"><p className="font-medium">No matching {pluralItem}</p><p className="mt-2 text-sm text-muted">Try a different search or clear the filters.</p><button type="button" onClick={() => { setSearch(''); setListFilter('ALL'); }} className="mt-4 border border-ink bg-white px-4 py-2 text-sm hover:bg-ink hover:text-white">Clear filters</button></div>}</div>
  </div>;
}

