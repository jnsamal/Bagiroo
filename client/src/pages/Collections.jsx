import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import OptimizedImage from '../components/shared/OptimizedImage';
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
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-10 border-b border-border pb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Curated edits</p><h1 className="section-title">Featured collections</h1></div>
      {!data.length && <EmptyState message="No collections configured yet." />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.map((c) => (
          <Link key={c.id} to={`/collections/${c.slug}`} className="category-card group block">
            {c.imageUrl ? (
              <OptimizedImage src={c.imageUrl} widths={[320, 480, 640, 800]} sizes="(max-width: 640px) 50vw, 25vw" alt={c.name} className="w-full aspect-[4/5] object-cover" />
            ) : (
              <PlaceholderImage label={c.name} className="w-full aspect-[4/5]" />
            )}
            <p className="mt-3 text-sm font-medium"><span className="category-label">{c.name}</span></p>
          </Link>
        ))}
      </div>
    </div>
  );
}
