import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import ProductGrid from '../components/shared/ProductGrid';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function BestSellers() {
  const [params, setParams] = useSearchParams();
  const requestedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { bestSeller: true, page }],
    queryFn: () => api.get(`/products?bestSeller=true&perPage=48&page=${page}`),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div className="store-section">
      <p className="text-sm text-muted mb-6"><Link to="/" className="hover:underline">Home</Link> / Best Sellers</p>
      <h1 className="section-title mb-3">Best Sellers</h1>
      <p className="text-muted mb-8">Explore our best-selling bags, selected by Bagiroo &amp; Co.</p>
      <p className="text-sm text-muted mb-6">{data.meta.total} products</p>
      {data.data.length ? <ProductGrid products={data.data} /> : <EmptyState message="No best sellers available on this page yet." />}
      {data.meta.totalPages > 1 && <nav aria-label="Best Sellers pagination" className="flex items-center justify-center gap-5 mt-10">
        <button type="button" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })} className="store-button border border-border disabled:opacity-40">Previous</button>
        <span className="text-sm">Page {page} of {data.meta.totalPages}</span>
        <button type="button" disabled={page >= data.meta.totalPages} onClick={() => setParams({ page: String(page + 1) })} className="store-button border border-border disabled:opacity-40">Next</button>
      </nav>}
    </div>
  );
}
