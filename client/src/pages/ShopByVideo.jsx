import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { resolveMediaUrl } from '../lib/media';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

// Grouped by category, per the spec's "separate video carousel/row per
// category" requirement.
export default function ShopByVideo() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['videos'],
    queryFn: () => api.get('/videos'),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError) return <ErrorState message={error.message} />;
  if (!data.length) return <EmptyState message="No videos configured yet." />;

  const grouped = data.reduce((acc, video) => {
    const categories = video.product?.categories?.map((pc) => pc.category.name) || ['Uncategorised'];
    categories.forEach((name) => {
      acc[name] = acc[name] || [];
      acc[name].push(video);
    });
    return acc;
  }, {});

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-2">Shop by Video</h1>
      <p className="text-muted mb-10">See every detail in motion, then shop the bag directly.</p>

      {Object.entries(grouped).map(([category, videos]) => (
        <section key={category} className="mb-12">
          <h2 className="text-xl font-medium mb-4">{category}</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {videos.map((v) => (
              <div key={v.id} className="snap-start shrink-0 w-[80%] md:w-[23%]">
                <video
                  src={v.url ? resolveMediaUrl(v.url) : undefined}
                  poster={v.posterUrl ? resolveMediaUrl(v.posterUrl) : undefined}
                  autoPlay
                  muted
                  loop
                  preload="metadata"
                  playsInline
                  disablePictureInPicture
                  className="w-full aspect-[3/4] object-cover bg-surface"
                />
                <p className="mt-3 text-sm">{v.caption || v.product?.title}</p>
                <Link to={`/product/${v.product?.slug}`} className="text-sm underline">
                  Shop this bag
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
