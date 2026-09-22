import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { resolveMediaUrl } from '../lib/media';
import { safeUrl } from '../lib/safeUrl';

export default function Gifting() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['navigation'], queryFn: () => api.get('/navigation') });
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold">Gifting</h1>
      {isLoading && <p role="status" className="mt-6">Loading…</p>}
      {isError && <p role="alert" className="mt-6">Could not load gifting products.</p>}
      {data && (data.gifting.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">{data.gifting.map((item) => <Link key={item.slug} to={safeUrl(item.to) || '/gifting'} className="product-card">
        {item.imageUrl && <div className="overflow-hidden"><img src={resolveMediaUrl(item.imageUrl)} alt={item.label} className="aspect-square w-full object-cover" /></div>}
        <p className="mt-3 text-sm">{item.label}</p>
      </Link>)}</div> : <p className="text-muted mt-6">No gifting products available yet.</p>)}
    </div>
  );
}
