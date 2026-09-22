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
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2">{data.name}</h1>
      {data.description && <p className="text-muted mb-8">{data.description}</p>}
      {data.products.length ? <ProductGrid products={data.products} /> : <EmptyState message="No products assigned to this collection yet." />}
    </div>
  );
}
