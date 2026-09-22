import { Link } from 'react-router-dom';
import PlaceholderImage from '../shared/PlaceholderImage';
import { resolveMediaUrl } from '../../lib/media';
import { useWebsite } from '../../lib/useWebsite';

export default function CategoryGrid({ categories }) {
  const website = useWebsite();
  return (
    <section className="store-section !max-w-none">
      <h2 className="section-title">{website.categoryTitle ?? 'Shop by category'}</h2>
      <p className="text-muted mt-1">{website.categoryDescription ?? 'Find the shape that fits your day.'}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mt-8">
        {categories.map((cat) => (
          <Link key={cat.id} to={`/shop/category/${cat.slug}`} className="category-card block group min-w-0">
            <div className="overflow-hidden bg-surface">
            {cat.imageUrl ? (
              <img loading="lazy" src={resolveMediaUrl(cat.imageUrl)} alt={cat.name} className="w-full aspect-[8/9] object-cover bg-surface" />
            ) : (
              <PlaceholderImage label={cat.name} className="w-full aspect-[8/9]" />
            )}
            </div>
            <p className="mt-3 text-sm uppercase tracking-wide"><span className="category-label">{cat.name}</span></p>
          </Link>
        ))}
      </div>
    </section>
  );
}
