import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import ProductGrid from '../components/shared/ProductGrid';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function CategoryArchive() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: () => api.get(`/categories/${slug}/products`),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <div className="bg-surface -mx-6 px-6 py-8 mb-10 text-center">
        <h1 className="text-3xl font-semibold">{data.category.name}</h1>
      </div>
      <p className="text-sm mb-6">
        <Link to="/shop" className="underline">
          ← Back to full collection
        </Link>
      </p>
      {data.products.length ? <ProductGrid products={data.products} /> : <EmptyState />}
    </div>
  );
}
