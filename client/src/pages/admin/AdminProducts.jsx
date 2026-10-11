import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import { resolveMediaUrl } from '../../lib/media';
import AdminProductForm from './AdminProductForm';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [notice, setNotice] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-products', { query, status, sort, page }], queryFn: () => api.get(`/admin/products?${new URLSearchParams({ q: query, status, sort, page: String(page), perPage: '20' })}`) });

  useEffect(() => {
    if (!data?.data?.length) { setSelectedId(''); return; }
    if (!data.data.some(product => product.id === selectedId)) setSelectedId(data.data[0].id);
  }, [data, selectedId]);

  const action = useMutation({
    mutationFn: ({ id, body, operation }) => operation === 'delete' ? api.delete(`/admin/products/${id}`) : operation ? api.post(`/admin/products/${id}/${operation}`, {}) : api.patch(`/admin/products/${id}`, body),
    onSuccess: (result, variables) => {
      setNotice(variables.operation === 'delete' ? result.message : variables.operation === 'restore' ? 'Product restored as a draft.' : 'Product updated.');
      if (variables.operation === 'delete' && variables.id === selectedId) setSelectedId('');
      ['admin-products', 'admin-products-count', 'admin-product', 'products', 'product', 'homepage', 'navigation', 'recommended-products', 'recently-viewed-products', 'admin-content'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  function productPrice(product) {
    const prices = (product.hasColorVariations ? product.variations : []).map(variation => variation.priceMinor ?? product.priceMinor).filter(value => value !== null && value !== undefined);
    if (!prices.length) return formatPrice(product.priceMinor) || 'Unpriced';
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
  }

  function availableStock(product) {
    const inventories = product.hasColorVariations && product.variations.length ? product.variations.map(variation => variation.inventory).filter(Boolean) : [product.inventory].filter(Boolean);
    return inventories.reduce((total, item) => total + Math.max(0, item.quantityAvailable - item.quantityReserved), 0);
  }

  const selectedProduct = data?.data?.find(product => product.id === selectedId);

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div><div className="flex items-baseline gap-3"><h1 className="section-title">Products</h1>{data && <span className="text-sm text-muted">{data.meta.total} products</span>}</div><p className="mt-3 text-sm text-muted">Manage product details, colours, stock visibility and storefront images.</p></div>
      <div className="flex gap-3"><Link to="/admin/products/import" className="border border-border bg-white px-4 py-3 text-sm hover:border-ink">Bulk import</Link><Link to="/admin/products/new" className="admin-primary">+ Add product</Link></div>
    </div>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_210px_auto]">
      <form onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }} className="flex border border-border bg-white focus-within:border-ink"><span className="flex items-center pl-4 text-muted" aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search products or product ID" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /><button className="px-4 text-sm font-medium">Search</button></form>
      <select aria-label="Product status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="border border-border bg-white px-3 py-2 text-sm"><option value="all">Active products</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select>
      <select aria-label="Sort products" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className="border border-border bg-white px-3 py-2 text-sm"><option value="newest">Newest first</option><option value="name_asc">Name: A to Z</option><option value="name_desc">Name: Z to A</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="stock_asc">Stock: low to high</option><option value="stock_desc">Stock: high to low</option></select>
      {(query || status !== 'all' || sort !== 'newest') && <button type="button" onClick={() => { setSearch(''); setQuery(''); setStatus('all'); setSort('newest'); setPage(1); }} className="px-3 text-sm underline">Reset view</button>}
    </div>
    {notice && <p role="status" className="mb-4 border border-border bg-white p-3 text-sm">{notice}</p>}
    {action.isError && <p role="alert" className="mb-4 text-sm text-red-700">{action.error.message}</p>}
    {isLoading ? <p role="status">Loading products…</p> : isError ? <p role="alert">{error.message} <button type="button" onClick={() => refetch()} className="underline">Try again</button></p> : <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.72fr)_minmax(580px,1.45fr)]">
      <section className="overflow-hidden border border-border bg-white" aria-label="Product list">
        <div className="border-b border-border bg-surface px-5 py-4"><h2 className="font-semibold">Catalogue</h2><p className="mt-1 text-xs text-muted">Select a product to edit it.</p></div>
        <div className="divide-y divide-border">{data.data.map(product => {
          const stock = availableStock(product);
          const selected = product.id === selectedId;
          return <button key={product.id} type="button" onClick={() => { setSelectedId(product.id); setNotice(''); }} className={`flex w-full items-center gap-4 p-4 text-left transition-colors ${selected ? 'bg-ink text-background' : 'hover:bg-surface'}`}>
            <span className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border ${selected ? 'border-white/20 bg-white/10' : 'border-border bg-surface'}`}>{product.media[0]?.url ? <img src={resolveMediaUrl(product.media[0].url)} alt="" className="h-full w-full object-cover" /> : <span className="text-xl font-semibold">{product.title.slice(0, 1)}</span>}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{product.title}</span><span className={`mt-1 block text-xs ${selected ? 'text-white/65' : 'text-muted'}`}>{product.hasColorVariations ? `${product.variations.length} ${product.variations.length === 1 ? 'colour' : 'colours'}` : 'Standard gallery'} · {stock} in stock</span><span className={`mt-1 block text-xs ${selected ? 'text-white/65' : 'text-muted'}`}>{product.sku}</span></span>
            <span className="shrink-0 text-right"><span className="block text-sm font-medium">{productPrice(product)}</span>{product.isPublished && product.priceMinor != null && product.priceMinor < 10000 && <span className={`mt-1 block text-[10px] uppercase tracking-wide ${selected ? 'text-amber-200' : 'text-amber-700'}`}>Check price</span>}<span className={`mt-2 inline-block px-2 py-1 text-xs ${product.deletedAt ? 'bg-red-100 text-red-800' : product.isPublished ? selected ? 'bg-white text-ink' : 'bg-green-100 text-green-800' : 'bg-surface text-muted'}`}>{product.deletedAt ? 'Archived' : product.isPublished ? 'Active' : 'Draft'}</span></span>
          </button>;
        })}{!data.data.length && <p className="p-8 text-sm text-muted">No products match these filters.</p>}</div>
        {data.meta.totalPages > 1 && <nav aria-label="Product pagination" className="flex items-center justify-between gap-3 border-t border-border p-4"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border border-border px-3 py-2 text-sm disabled:opacity-30">Previous</button><span className="text-xs text-muted">{page} / {data.meta.totalPages}</span><button type="button" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="border border-border px-3 py-2 text-sm disabled:opacity-30">Next</button></nav>}
      </section>
      <section className="min-w-0">{selectedProduct ? <AdminProductForm key={selectedProduct.id} productId={selectedProduct.id} embedded onSaved={() => setNotice('Product saved.')} deleting={action.isPending} onDelete={() => {
        const confirmed = window.confirm(`Remove “${selectedProduct.title}” from the website?\n\nThe product will be archived and can be restored later.`);
        if (confirmed) action.mutate({ id: selectedProduct.id, operation: 'delete' });
      }} /> : <div className="admin-panel flex min-h-64 items-center justify-center text-center text-sm text-muted">Select a product to edit, or add a new product.</div>}</section>
    </div>}
  </div>;
}
