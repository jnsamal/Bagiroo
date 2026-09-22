import { Link } from 'react-router-dom';
import ProductGrid from '../shared/ProductGrid';

export default function FeaturedCollectionGrid({ collection }) {
  if (!collection) return null;
  const products = (collection.products || []).map(item => item.product).filter(Boolean);

  return (
    <section className="store-section !max-w-none">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div><h2 className="section-title">{collection.name}</h2>{collection.description && <p className="text-muted mt-2">{collection.description}</p>}</div>
        <Link to={`/collections/${collection.slug}`} className="store-button shrink-0 bg-ink text-background">View all</Link>
      </div>
      {products.length ? <ProductGrid products={products} /> : <p className="text-sm text-muted">No published products are assigned to this collection yet.</p>}
    </section>
  );
}
