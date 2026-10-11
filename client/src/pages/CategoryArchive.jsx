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
    <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 py-10 md:py-16" data-scroll-reveal>
      <div className="border-b border-border pb-8 mb-10">
        <p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Shop by category</p><h1 className="section-title">{data.category.name}</h1>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">{data.products.length} {data.products.length === 1 ? 'product' : 'products'}</p>
        <Link to="/shop" className="text-sm underline underline-offset-4">
          ← Back to full collection
        </Link>
      </div>
      {data.products.length ? <ProductGrid products={data.products} /> : <EmptyState />}
    </div>
  );
}
