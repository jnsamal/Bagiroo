import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { readRecentlyViewed, recordRecentlyViewed } from '../../lib/recentlyViewed';
import ProductGrid from '../shared/ProductGrid';

export default function RecentlyViewedProducts({ currentSlug }) {
  const [slugs, setSlugs] = useState(() => readRecentlyViewed().filter((slug) => slug !== currentSlug));
  useEffect(() => { setSlugs(recordRecentlyViewed(currentSlug)); }, [currentSlug]);
  const previousSlugs = slugs.filter((slug) => slug !== currentSlug);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recently-viewed-products', previousSlugs],
    queryFn: () => api.get(`/products?${new URLSearchParams({ slugs: previousSlugs.join(','), perPage: '12' })}`),
    enabled: previousSlugs.length > 0,
    staleTime: 0,
  });
  const products = previousSlugs.map((slug) => data?.data.find((product) => product.slug === slug)).filter(Boolean);
  return <section className="mt-16 border-t border-border pt-10">
    <h2 className="section-title mb-6">Previously viewed products</h2>
    {!previousSlugs.length ? <p className="text-sm text-muted">Products you browse will appear here.</p> : isLoading ? <p role="status" className="text-sm text-muted">Loading previously viewed products…</p> : isError ? <p role="alert" className="text-sm">Could not load previously viewed products. <button type="button" onClick={() => refetch()} className="underline">Try again</button></p> : products.length ? <ProductGrid products={products} /> : <p className="text-sm text-muted">Previously viewed products are no longer available.</p>}
  </section>;
}
