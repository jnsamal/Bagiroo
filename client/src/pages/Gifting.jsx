import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import OptimizedImage from '../components/shared/OptimizedImage';
import { safeUrl } from '../lib/safeUrl';

export default function Gifting() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['navigation'], queryFn: () => api.get('/navigation') });
  return (
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-10 border-b border-border pb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Made to give</p><h1 className="section-title">Gifting</h1><p className="mt-3 text-muted">Considered bags for meaningful occasions.</p></div>
      {isLoading && <p role="status" className="mt-6">Loading…</p>}
      {isError && <p role="alert" className="mt-6">Could not load gifting products.</p>}
      {data && (data.gifting.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">{data.gifting.map((item) => <Link key={item.slug} to={safeUrl(item.to) || '/gifting'} className="product-card">
        {item.imageUrl && <div className="overflow-hidden bg-surface"><OptimizedImage src={item.imageUrl} widths={[320, 480, 640, 800]} sizes="(max-width: 640px) 50vw, 25vw" alt={item.label} className="aspect-[4/5] w-full object-cover" /></div>}
        <p className="mt-3 text-sm font-medium">{item.label}</p>
      </Link>)}</div> : <p className="text-muted mt-6">No gifting products available yet.</p>)}
    </div>
  );
}
