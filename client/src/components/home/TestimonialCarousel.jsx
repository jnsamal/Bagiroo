import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { resolveMediaUrl } from '../../lib/media';

export default function TestimonialCarousel({ testimonials = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  const visibleCount = Math.min(isDesktop ? 3 : 1, testimonials.length);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || testimonials.length <= visibleCount) return undefined;
    const timer = window.setInterval(() => { setDirection(1); setIndex((current) => (current + 1) % testimonials.length); }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, testimonials.length, visibleCount]);
  useEffect(() => { if (index >= testimonials.length) setIndex(0); }, [index, testimonials.length]);
  if (!testimonials.length) return null;

  const visibleStories = Array.from({ length: visibleCount }, (_, offset) => testimonials[(index + offset) % testimonials.length]);
  const go = (step) => { setDirection(step); setIndex((current) => (current + step + testimonials.length) % testimonials.length); };
  return (
    <section className="w-full px-5 sm:px-8 lg:px-12 py-16 text-center" aria-roledescription="carousel" aria-label="Customer stories" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <h2 className="text-3xl font-semibold mb-10">Customer stories</h2>
      <div className="mx-auto flex items-center gap-3 sm:gap-6">
        <button type="button" onClick={() => go(-1)} disabled={testimonials.length <= visibleCount} aria-label="Previous customer stories" className="shrink-0 w-10 h-10 border border-border rounded-full disabled:opacity-30">‹</button>
        <div key={visibleStories.map(story => story.id).join('-')} className={`testimonial-slide ${direction < 0 ? 'from-left' : 'from-right'} flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch`}>
          {visibleStories.map(story => <StoryCard key={story.id} story={story} />)}
        </div>
        <button type="button" onClick={() => go(1)} disabled={testimonials.length <= visibleCount} aria-label="Next customer stories" className="shrink-0 w-10 h-10 border border-border rounded-full disabled:opacity-30">›</button>
      </div>
      {testimonials.length > visibleCount && <div className="flex justify-center gap-2 mt-6" aria-label="Choose customer story">{testimonials.map((testimonial, storyIndex) => <button key={testimonial.id} type="button" onClick={() => { setDirection(storyIndex < index ? -1 : 1); setIndex(storyIndex); }} aria-label={`Show customer story ${storyIndex + 1}`} aria-current={storyIndex === index ? 'true' : undefined} className={`w-2 h-2 rounded-full transition-colors ${storyIndex === index ? 'bg-ink' : 'bg-border'}`} />)}</div>}
    </section>
  );
}

function StoryCard({ story }) {
  const quoteRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    const quote = quoteRef.current;
    if (!quote) return undefined;
    const measure = () => setCanExpand(quote.scrollHeight > quote.clientHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(quote);
    return () => observer.disconnect();
  }, [story.quote]);

  return <article className="flex h-[27rem] min-w-0 flex-col border border-border bg-background p-6 sm:h-[29rem] sm:p-8">
    <div className="mx-auto mb-5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-sm font-medium uppercase text-background">
      {story.avatarUrl
        ? <img src={resolveMediaUrl(story.avatarUrl)} alt="" className="h-full w-full object-cover" />
        : <span aria-hidden="true">{story.authorName?.charAt(0) || 'B'}</span>}
    </div>
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={quoteRef} className={`min-h-0 flex-1 text-sm leading-relaxed text-muted ${expanded ? 'overflow-y-auto pr-2' : 'line-clamp-[8] overflow-hidden'}`}>
        {story.quote}
        {story.isPlaceholder && <span className="block mt-2 text-xs text-muted/70">(placeholder content)</span>}
      </div>
      {(canExpand || expanded) && <button type="button" onClick={() => setExpanded(current => !current)} aria-expanded={expanded} className="mx-auto mt-3 shrink-0 border border-ink px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-200 hover:bg-ink hover:text-background focus-visible:bg-ink focus-visible:text-background focus-visible:outline-none">
        {expanded ? 'Less' : 'More'}
      </button>}
    </div>
    <div className="mt-5 shrink-0 border-t border-border pt-4">
      <p className="font-medium">{story.authorName}</p>
      <p className="mt-1 text-yellow-600" aria-label={`${story.rating} out of 5 stars`}>{'★'.repeat(story.rating)}</p>
    </div>
  </article>;
}
