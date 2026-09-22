import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media';
import { formatPrice } from '../../lib/money';

export default function HeaderSearch({ open, onClose, initialQuery = '' }) {
  const inputRef = useRef(null);
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  useEffect(() => { setInput(initialQuery); setQuery(initialQuery.trim()); }, [initialQuery]);
  useEffect(() => { if (open) inputRef.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => { const timer = setTimeout(() => setQuery(input.trim()), 250); return () => clearTimeout(timer); }, [input]);
  const { data, isFetching, isError, refetch } = useQuery({ queryKey: ['products', { q: query, searchBox: true }], queryFn: () => api.get(`/products?${new URLSearchParams({ q: query, perPage: '8' })}`), enabled: open && Boolean(query) });
  return <section id="header-search" aria-label="Product search" aria-hidden={!open} inert={!open ? '' : undefined} className={`header-search-panel ${open ? 'is-open' : ''} absolute inset-x-0 top-full z-50 bg-background border-y border-border px-5 sm:px-8 lg:px-12 py-6`} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
    <div className="max-w-3xl mx-auto">
      <form role="search" onSubmit={e => { e.preventDefault(); setQuery(input.trim()); }} className="flex gap-3">
        <input ref={inputRef} type="search" aria-label="Search products" placeholder="Search products…" value={input} onChange={e => setInput(e.target.value)} className="flex-1 min-w-0 border border-border bg-background px-4 py-3" />
        <button type="button" onClick={onClose} className="px-3 text-sm" aria-label="Close search">✕</button>
      </form>
      <div className="mt-4 max-h-[55dvh] overflow-y-auto overscroll-contain" aria-live="polite">
        {!query ? <p className="text-sm text-muted">Type a product name to search.</p> : isFetching || query !== input.trim() ? <p className="text-sm text-muted">Searching…</p> : isError ? <p className="text-sm">Could not load results. <button type="button" onClick={() => refetch()} className="underline">Try again</button></p> : data?.data.length ? <>
          <p className="text-xs text-muted mb-3">{data.meta.total} matching products</p>
          {data.data.map(product => { const colour = product.variations?.find(v => v.isDefault) || product.variations?.[0]; const image = colour?.imageUrl || product.media?.[0]?.url; return <Link key={product.id} to={`/product/${product.slug}`} onClick={onClose} className="flex items-center gap-4 border-b border-border py-3 hover:bg-surface focus-visible:bg-surface">
            {image && <img src={resolveMediaUrl(image)} alt="" className="w-16 h-16 object-cover shrink-0" />}<div><p className="text-sm">{product.title}</p><p className="text-xs text-muted mt-2">{formatPrice(colour?.priceMinor ?? product.priceMinor) || 'Price unavailable'}</p></div>
          </Link>; })}
        </> : <p className="text-sm text-muted">No products found for “{query}”.</p>}
      </div>
    </div>
  </section>;
}
