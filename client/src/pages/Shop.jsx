import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import FilterSortBar from '../components/shop/FilterSortBar';
import ProductGrid from '../components/shared/ProductGrid';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'latest';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { category, sort }],
    queryFn: () =>
      api.get(`/products?${new URLSearchParams({ ...(category && { category }), sort, perPage: '48' })}`),
  });

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <div className="bg-surface -mx-6 px-6 py-8 mb-10 text-center">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-semibold">Collection</h1>
          <Link to="/shop/categories" className="text-sm underline underline-offset-2 hover:text-primary transition-colors">
            Browse by Category
          </Link>
        </div>
      </div>

      <FilterSortBar
        categories={categories || []}
        selectedCategory={category}
        onCategoryChange={(v) => updateParam('category', v)}
        sort={sort}
        onSortChange={(v) => updateParam('sort', v)}
      />

      {isLoading && <LoadingSkeleton className="h-96" />}
      {isError && <ErrorState message={error.message} />}
      {data && (
        <>
          <p className="text-sm text-muted mb-6">Showing all {data.meta.total} results</p>
          {data.data.length ? <ProductGrid products={data.data} /> : <EmptyState />}
        </>
      )}
    </div>
  );
}
