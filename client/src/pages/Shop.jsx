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
    <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 py-10 md:py-16" data-scroll-reveal>
      <div className="border-b border-border pb-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Bagiroo collection</p><h1 className="section-title">Shop all</h1></div>
          <Link to="/shop/categories" className="text-sm underline underline-offset-4 hover:text-muted transition-colors">
            Browse by category
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">{data.meta.total} {data.meta.total === 1 ? 'product' : 'products'}</p>{category && <button type="button" onClick={() => updateParam('category', '')} className="text-sm underline underline-offset-4">Clear category filter</button>}</div>
          {data.data.length ? <ProductGrid products={data.data} /> : <EmptyState />}
        </>
      )}
    </div>
  );
}
