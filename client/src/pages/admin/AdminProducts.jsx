import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import { resolveMediaUrl } from '../../lib/media';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-products', { query, status, page }], queryFn: () => api.get(`/admin/products?${new URLSearchParams({ q: query, status, page: String(page), perPage: '20' })}`) });
  const action = useMutation({
    mutationFn: ({ id, body, operation }) => operation === 'delete' ? api.delete(`/admin/products/${id}`) : operation ? api.post(`/admin/products/${id}/${operation}`, {}) : api.patch(`/admin/products/${id}`, body),
    onSuccess: (_data, variables) => {
      setNotice(variables.operation === 'delete' ? _data.message : variables.operation === 'archive' ? 'Product removed from the storefront. You can restore it from Archived products.' : variables.operation === 'restore' ? 'Product restored as a draft.' : 'Product updated.');
      ['admin-products', 'admin-products-count', 'admin-product', 'products', 'product', 'homepage', 'navigation', 'recommended-products', 'recently-viewed-products', 'admin-content'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      if (variables.operation && data?.data.length === 1 && page > 1) setPage(page - 1);
    },
  });
  function update(id, body, operation) { setNotice(''); action.mutate({ id, body, operation }); }
  function price(product) {
    const prices = product.variations.map(variation => variation.priceMinor ?? product.priceMinor).filter(value => value !== null && value !== undefined);
    if (!prices.length) return formatPrice(product.priceMinor) || 'Unpriced';
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div><h1 className="section-title">Products</h1><p className="text-sm text-muted mt-3">Manage your catalogue, visibility and featured products.</p></div><div className="flex gap-3"><Link to="/admin/products/import" className="border border-border bg-white px-4 py-3 text-sm">Bulk import</Link><Link to="/admin/products/new" className="admin-primary">+ New product</Link></div></div>
    <form onSubmit={e => { e.preventDefault(); setQuery(search.trim()); setPage(1); }} className="admin-panel flex flex-wrap gap-3 mb-6">
      <input aria-label="Search product title or product ID" placeholder="Search title or product ID" value={search} onChange={e => setSearch(e.target.value)} className="admin-input flex-1 min-w-[180px]" />
      <button className="admin-primary">Search</button>
      <select aria-label="Product status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-border px-3 py-2 text-sm"><option value="all">All active products</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select>
      {(query || status !== 'all') && <button type="button" onClick={() => { setSearch(''); setQuery(''); setStatus('all'); setPage(1); }} className="text-sm underline">Clear filters</button>}
    </form>
    {notice && <p role="status" className="text-sm mb-4">{notice}</p>}
    {action.isError && <p role="alert" className="text-sm text-red-700 mb-4">{action.error.message}</p>}
    {isLoading ? <p role="status">Loading products…</p> : isError ? <p role="alert">{error.message} <button type="button" onClick={() => refetch()} className="underline">Try again</button></p> : <>
      <p className="text-sm text-muted mb-4">{data.meta.total} products · Featured products must be published to appear in the storefront.</p>
      <div className="overflow-x-auto bg-white border border-border"><table className="w-full text-sm"><thead className="bg-surface text-left"><tr>{['Product', 'Price', 'Stock', 'Published', 'Best Seller', 'New Arrival', 'Actions'].map(label => <th key={label} className="p-4 whitespace-nowrap">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">{data.data.map(product => {
        const inventories = product.variations.length ? product.variations.map(variation => variation.inventory).filter(Boolean) : [product.inventory].filter(Boolean);
        const stock = inventories.reduce((total, item) => total + Math.max(0, item.quantityAvailable - item.quantityReserved), 0);
        return <tr key={product.id}><td className="p-4"><div className="flex items-center gap-3 min-w-[230px]">{product.media[0]?.url && <img src={resolveMediaUrl(product.media[0].url)} alt="" className="w-12 h-12 object-cover shrink-0" />}<div><Link to={`/admin/products/${product.id}/edit`} className="font-medium hover:underline">{product.title}</Link><p className="text-xs text-muted mt-1">{product.sku}</p></div></div></td><td className="p-4 whitespace-nowrap">{price(product)}</td><td className="p-4"><Link to="/admin/content/inventory" className="underline" aria-label={`Manage stock for ${product.title}`}>{stock}</Link></td>
        {['isPublished', 'isBestSeller', 'isNewArrival'].map((field, index) => <td key={field} className="p-4"><input type="checkbox" aria-label={`${['Publish', 'Feature as Best Seller', 'Feature as New Arrival'][index]} ${product.title}`} checked={product[field]} disabled={action.isPending || Boolean(product.deletedAt)} onChange={e => update(product.id, { [field]: e.target.checked })} /></td>)}
        <td className="p-4 whitespace-nowrap"><div className="flex gap-4"><Link to={`/admin/products/${product.id}/edit`} className="underline">Edit</Link>{product.deletedAt ? <><button type="button" disabled={action.isPending} onClick={() => update(product.id, null, 'restore')} className="underline">Restore</button><button type="button" disabled={action.isPending} aria-label={`Delete ${product.title} permanently`} onClick={() => update(product.id, null, 'delete')} className="text-red-700 underline">Delete permanently</button></> : <><Link to={`/product/${product.slug}`} target="_blank" className="underline">Preview</Link><button type="button" disabled={action.isPending} aria-label={`Remove ${product.title}`} onClick={() => update(product.id, null, 'delete')} className="text-red-700 underline">Remove</button></>}</div></td></tr>;
      })}</tbody></table>{!data.data.length && <p className="text-sm text-muted p-8">No products match these filters.</p>}</div>
      {data.meta.totalPages > 1 && <nav aria-label="Product pagination" className="flex items-center justify-between gap-4 mt-6"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="admin-primary">Previous</button><span className="text-sm">Page {page} of {data.meta.totalPages}</span><button type="button" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="admin-primary">Next</button></nav>}
    </>}
  </div>;
}
