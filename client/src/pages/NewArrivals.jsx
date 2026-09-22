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
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">New Arrivals</h1>
      {data.data.length ? <ProductGrid products={data.data} /> : <EmptyState />}
    </div>
  );
}
