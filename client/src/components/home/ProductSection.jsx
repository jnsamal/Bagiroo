import { Link } from 'react-router-dom';
import ProductGrid from '../shared/ProductGrid';
import EmptyState from '../shared/EmptyState';

export default function ProductSection({ title, viewAllHref, products }) {
  return (
    <section className="store-section !max-w-none">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h2 className="section-title">{title}</h2>
        <Link to={viewAllHref} className="store-button shrink-0 bg-ink text-background">
          View all
        </Link>
      </div>
      {products.length ? <ProductGrid products={products} /> : <EmptyState message={`No ${title.toLowerCase()} yet.`} />}
    </section>
  );
}
