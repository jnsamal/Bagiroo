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
  if (!data.length) return <div className="store-section"><EmptyState message="No videos configured yet." /></div>;

  const grouped = data.reduce((acc, video) => {
    const categories = video.product?.categories?.map((pc) => pc.category.name) || ['Uncategorised'];
    categories.forEach((name) => {
      acc[name] = acc[name] || [];
      acc[name].push(video);
    });
    return acc;
  }, {});

  return (
    <div className="store-section !max-w-none" data-scroll-reveal>
      <div className="mb-12 border-b border-border pb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">See it in motion</p><h1 className="section-title">Shop by video</h1><p className="text-muted mt-3">See every detail in motion, then shop the bag directly.</p></div>

      {Object.entries(grouped).map(([category, videos]) => (
        <section key={category} className="mb-12">
          <h2 className="text-xl font-semibold mb-5">{category}</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {videos.map((v) => (
              <article key={v.id} className="snap-start shrink-0 w-[72%] sm:w-[42%] lg:w-[224px]">
                <video
                  src={v.url ? resolveMediaUrl(v.url, { video: true, width: 480 }) : undefined}
                  poster={v.posterUrl ? resolveMediaUrl(v.posterUrl, { width: 480 }) : undefined}
                  autoPlay
                  muted
                  loop
                  preload="metadata"
                  playsInline
                  disablePictureInPicture
                  className="w-full aspect-[224/398] object-cover bg-surface"
                />
                <p className="mt-3 min-h-10 text-sm font-medium line-clamp-2">{v.caption || v.product?.title}</p>
                <Link to={`/product/${v.product?.slug}`} className="text-sm underline underline-offset-4">
                  Shop this bag
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
