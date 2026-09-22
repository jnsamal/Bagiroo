import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import { resolveMediaUrl } from '../lib/media';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function Collections() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get('/collections'),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Featured Collections</h1>
      {!data.length && <EmptyState message="No collections configured yet." />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.map((c) => (
          <Link key={c.id} to={`/collections/${c.slug}`} className="block">
            {c.imageUrl ? (
              <img src={resolveMediaUrl(c.imageUrl)} alt={c.name} className="w-full aspect-square object-cover" />
            ) : (
              <PlaceholderImage label={c.name} className="w-full aspect-square" />
            )}
            <p className="mt-3 text-sm">{c.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
