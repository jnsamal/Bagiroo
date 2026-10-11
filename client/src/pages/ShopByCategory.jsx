import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import OptimizedImage from '../components/shared/OptimizedImage';

export default function ShopByCategory() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  const categories = data || [];

  return (
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-10 border-b border-border pb-8">
        <p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Find your shape</p><h1 className="section-title">Shop by category</h1>
        <p className="text-muted mt-3">Explore the collection by silhouette.</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-muted py-12">No categories available.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/shop/category/${category.slug}`}
              className="category-card group block overflow-hidden"
            >
              <div className="aspect-[4/5] relative bg-surface overflow-hidden">
                {category.imageUrl ? (
                  <OptimizedImage
                    src={category.imageUrl}
                    widths={[320, 480, 640, 800]}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <PlaceholderImage className="w-full h-full" />
                )}
              </div>
              <div className="pt-3">
                <h3 className="text-sm font-medium">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
