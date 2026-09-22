import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import ProductGrid from '../shared/ProductGrid';

export default function RelatedProducts({ categorySlug, excludeSlug }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommended-products', categorySlug, excludeSlug],
    queryFn: async () => {
      const base = { excludeSlug, perPage: '4' };
      const requests = [api.get(`/products?${new URLSearchParams(base)}`)];
      if (categorySlug) requests.push(api.get(`/products?${new URLSearchParams({ ...base, category: categorySlug })}`));
      const [catalogue, related] = await Promise.all(requests);
      return [...new Map([...(related?.data || []), ...catalogue.data].map((product) => [product.id, product])).values()].slice(0, 4);
    },
  });


  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="section-title mb-6">Recommended products</h2>
      {isLoading && <p role="status" className="text-sm text-muted">Loading recommendations…</p>}
      {isError && <p role="alert" className="text-sm">Could not load recommendations. <button type="button" onClick={() => refetch()} className="underline">Try again</button></p>}
      {data && (data.length ? <ProductGrid products={data} /> : <p className="text-sm text-muted">No other products available yet.</p>)}
    </section>
  );
}
