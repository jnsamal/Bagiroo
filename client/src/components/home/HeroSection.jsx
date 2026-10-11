import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../lib/media';
import { useWebsite } from '../../lib/useWebsite';
import { safeUrl } from '../../lib/safeUrl';
import OptimizedImage from '../shared/OptimizedImage';

const HERO_IMAGE_URL = '/uploads/site/hero.png';

function HeroMedia({ slide, eager = false }) {
  return slide.type === 'video'
    ? <video src={resolveMediaUrl(slide.url, { video: true, width: 1920 })} autoPlay muted loop playsInline preload="metadata" aria-label={slide.altText || 'Bagiroo featured video'} className="h-full w-full object-cover" />
    : <OptimizedImage src={slide.url} widths={[640, 960, 1280, 1600, 1920, 2400]} sizes="100vw" loading={eager ? 'eager' : 'lazy'} alt={slide.altText || ''} className="h-full w-full object-cover" fetchPriority={eager ? 'high' : 'auto'} />;
}

export default function HeroSection() {
  const website = useWebsite();
  const slides = useMemo(() => website.heroSlides?.filter(slide => slide?.url) || [], [website.heroSlides]);
  const availableSlides = slides.length ? slides : [{ id: 'fallback', type: 'image', url: website.heroImage || HERO_IMAGE_URL, altText: 'Bagiroo collection' }];
  const [carousel, setCarousel] = useState({ activeIndex: 0, previousIndex: null, direction: 1, revision: 0 });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setCarousel(state => ({ ...state, activeIndex: Math.min(state.activeIndex, availableSlides.length - 1), previousIndex: null }));
  }, [availableSlides.length]);
  useEffect(() => {
    if (paused || availableSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setCarousel(state => ({
      activeIndex: (state.activeIndex + 1) % availableSlides.length,
      previousIndex: state.activeIndex,
      direction: 1,
      revision: state.revision + 1,
    })), 5000);
    return () => window.clearInterval(timer);
  }, [availableSlides.length, paused]);

  const activeSlide = availableSlides[carousel.activeIndex];
  const previousSlide = carousel.previousIndex === null ? null : availableSlides[carousel.previousIndex];
  const move = direction => setCarousel(state => ({
    activeIndex: (state.activeIndex + direction + availableSlides.length) % availableSlides.length,
    previousIndex: state.activeIndex,
    direction,
    revision: state.revision + 1,
  }));
  const selectSlide = index => {
    if (index === carousel.activeIndex) return;
    setCarousel(state => ({ activeIndex: index, previousIndex: state.activeIndex, direction: index > state.activeIndex ? 1 : -1, revision: state.revision + 1 }));
  };

  return (
    <section
      className="relative flex min-h-[520px] items-end overflow-hidden bg-ink text-background md:min-h-[640px] md:items-center lg:min-h-[76vh]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      {previousSlide && <div key={`previous-${carousel.revision}`} className={`absolute inset-0 ${carousel.direction > 0 ? 'hero-slide-exit-left' : 'hero-slide-exit-right'}`} aria-hidden="true">
        <HeroMedia slide={previousSlide} />
      </div>}
      <div
        key={`active-${activeSlide.id}-${carousel.revision}`}
        className={`absolute inset-0 ${carousel.revision ? (carousel.direction > 0 ? 'hero-slide-enter-right' : 'hero-slide-enter-left') : ''}`}
        onAnimationEnd={() => setCarousel(state => state.revision === carousel.revision ? { ...state, previousIndex: null } : state)}
      >
        <HeroMedia slide={activeSlide} eager={carousel.activeIndex === 0} />
      </div>
      <div className="absolute inset-0 bg-ink" style={{ opacity: (website.heroOverlay ?? 40) / 100 }} aria-hidden="true" />
      <div className="relative w-full px-5 py-16 sm:px-8 md:py-24 lg:px-12">
        <h1 className="max-w-2xl text-balance text-5xl font-semibold leading-[1.03] tracking-[-0.045em] md:text-6xl lg:text-7xl">{website.heroTitle ?? 'Designed for every move'}</h1>
        <p className="mt-5 max-w-md leading-relaxed text-background/85">{website.heroDescription ?? 'Considered silhouettes, confident colour and room for the rhythm of your day.'}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link to={safeUrl(website.heroButtonUrl) || '/shop'} className="store-button hero-collection-button border border-background bg-background text-ink">{website.heroButtonLabel ?? 'Explore the collection'}</Link>
          <Link to="/new-arrivals" className="text-xs uppercase tracking-widest underline underline-offset-8 hover:text-background/70">Shop new arrivals</Link>
        </div>
      </div>
      {availableSlides.length > 1 && <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:right-8 lg:right-12">
        <button type="button" onClick={() => move(-1)} aria-label="Previous hero slide" className="flex h-10 w-10 items-center justify-center border border-white/60 bg-black/20 text-2xl text-white hover:bg-white hover:text-ink">‹</button>
        <div className="flex gap-2 px-2" role="group" aria-label="Choose hero slide">{availableSlides.map((slide, index) => <button key={slide.id} type="button" onClick={() => selectSlide(index)} aria-label={`Show slide ${index + 1}`} aria-current={index === carousel.activeIndex ? 'true' : undefined} className={`h-2.5 w-2.5 rounded-full border border-white ${index === carousel.activeIndex ? 'bg-white' : 'bg-transparent'}`} />)}</div>
        <button type="button" onClick={() => move(1)} aria-label="Next hero slide" className="flex h-10 w-10 items-center justify-center border border-white/60 bg-black/20 text-2xl text-white hover:bg-white hover:text-ink">›</button>
      </div>}
    </section>
  );
}
