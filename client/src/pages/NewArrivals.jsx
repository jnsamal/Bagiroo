import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import ProductGrid from '../components/shared/ProductGrid';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function NewArrivals() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { newArrival: true }],
    queryFn: () => api.get('/products?newArrival=true&perPage=48'),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-10 border-b border-border pb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Latest edit</p><h1 className="section-title">New arrivals</h1><p className="mt-3 text-sm text-muted">{data.data.length} {data.data.length === 1 ? 'product' : 'products'}</p></div>
      {data.data.length ? <ProductGrid products={data.data} /> : <EmptyState />}
    </div>
  );
}
