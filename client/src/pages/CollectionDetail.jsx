import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import ProductGrid from '../components/shared/ProductGrid';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function CollectionDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collection', slug],
    queryFn: () => api.get(`/collections/${slug}`),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-10 border-b border-border pb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Collection</p><h1 className="section-title">{data.name}</h1>{data.description && <p className="mt-3 max-w-2xl text-muted">{data.description}</p>}<p className="mt-3 text-sm text-muted">{data.products.length} {data.products.length === 1 ? 'product' : 'products'}</p></div>
      {data.products.length ? <ProductGrid products={data.products} /> : <EmptyState message="No products assigned to this collection yet." />}
    </div>
  );
}
