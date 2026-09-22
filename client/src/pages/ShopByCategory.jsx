import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import { resolveMediaUrl } from '../lib/media';

export default function ShopByCategory() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  const categories = data || [];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <div className="bg-surface -mx-6 px-6 py-8 mb-10 text-center">
        <h1 className="text-3xl font-semibold">Shop by Category</h1>
        <p className="text-muted mt-2">Explore our collections by category</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-muted py-12">No categories available.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/shop/category/${category.slug}`}
              className="group block bg-white rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <div className="aspect-square relative bg-gray-50 overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={resolveMediaUrl(category.imageUrl)}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <PlaceholderImage className="w-full h-full" />
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-medium group-hover:text-primary transition-colors">
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
