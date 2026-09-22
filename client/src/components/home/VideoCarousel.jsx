import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../lib/media';
import { formatPrice } from '../../lib/money';

// Scroll-snap provides swipe/partial-next-card behaviour on mobile.
export default function VideoCarousel({ videos }) {
  const carouselRef = useRef(null);
  if (!videos.length) return null;
  const scroll = direction => carouselRef.current?.scrollBy({ left: direction * carouselRef.current.clientWidth * 0.82, behavior: 'smooth' });

  return (
    <section className="w-full px-5 sm:px-8 lg:px-12 py-16">
      <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-tight">The Style Edit</h2>
      <div className="relative mt-8">
      <div ref={carouselRef} className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-3 overscroll-x-contain">
        {videos.map((v) => (
          <article key={v.id} className="snap-start shrink-0 w-[68%] sm:w-[40%] md:w-[27%] lg:w-[17%] xl:w-[12.5%] min-w-0">
            <Link to={`/product/${v.product?.slug}`} className="block group">
            <div className="overflow-hidden bg-surface">
            <video
              src={v.url ? resolveMediaUrl(v.url) : undefined}
              poster={v.posterUrl ? resolveMediaUrl(v.posterUrl) : undefined}
              autoPlay
              muted
              loop
              preload="metadata"
              playsInline
              disablePictureInPicture
              className="w-full aspect-[224/398] object-cover bg-surface transition-transform duration-500 group-hover:scale-[1.02]"
            />
            </div>
            <p className="mt-3 text-sm font-medium uppercase line-clamp-1">{v.caption || v.product?.title}</p>
            <p className="mt-1 text-sm flex flex-wrap gap-3">
              <span>{formatPrice(v.product?.variations?.find(item => item.isDefault)?.priceMinor ?? v.product?.variations?.[0]?.priceMinor ?? v.product?.priceMinor) || 'Price unavailable'}</span>
              {(v.product?.variations?.find(item => item.isDefault)?.compareAtMinor ?? v.product?.variations?.[0]?.compareAtMinor ?? v.product?.compareAtMinor) > (v.product?.variations?.find(item => item.isDefault)?.priceMinor ?? v.product?.variations?.[0]?.priceMinor ?? v.product?.priceMinor) && <del className="text-muted">{formatPrice(v.product?.variations?.find(item => item.isDefault)?.compareAtMinor ?? v.product?.variations?.[0]?.compareAtMinor ?? v.product?.compareAtMinor)}</del>}
            </p>
            </Link>
          </article>
        ))}
      </div>
      {videos.length > 1 && <>
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous videos" className="absolute left-0 top-[42%] -translate-y-1/2 w-12 h-20 bg-ink/65 text-background text-4xl flex items-center justify-center hover:bg-ink transition-colors">‹</button>
        <button type="button" onClick={() => scroll(1)} aria-label="Next videos" className="absolute right-0 top-[42%] -translate-y-1/2 w-12 h-20 bg-ink/65 text-background text-4xl flex items-center justify-center hover:bg-ink transition-colors">›</button>
      </>}
      </div>
    </section>
  );
}
