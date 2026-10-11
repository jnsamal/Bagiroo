import { useEffect, useRef, useState } from 'react';
import PlaceholderImage from '../shared/PlaceholderImage';
import OptimizedImage from '../shared/OptimizedImage';

// Desktop thumbnail rail; mobile thumbnails and horizontal swipe navigation.
export default function ProductGallery({ images = [], title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const gesture = useRef(null);
  const thumbnailRail = useRef(null);
  const slides = images.length ? images : [{ id: 'placeholder', url: null }];
  const active = slides[activeIndex] || slides[0];
  const move = (direction) => setActiveIndex((index) => (index + direction + slides.length) % slides.length);

  useEffect(() => {
    const rail = thumbnailRail.current;
    const thumb = rail?.children[activeIndex];
    if (!thumb) return;
    if (thumb.offsetLeft < rail.scrollLeft) rail.scrollLeft = thumb.offsetLeft;
    else if (thumb.offsetLeft + thumb.offsetWidth > rail.scrollLeft + rail.clientWidth) rail.scrollLeft = thumb.offsetLeft + thumb.offsetWidth - rail.clientWidth;
  }, [activeIndex]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event) => { if (event.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', close); };
  }, [fullscreen]);

  return (
    <div className="flex gap-4 min-w-0">
      <div className="hidden md:flex flex-col gap-3 w-20">
        {slides.map((img, i) => (
          <button
            key={img.id}
            type="button"
            aria-label={`View ${title} image ${i + 1}`}
            aria-pressed={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={`border ${i === activeIndex ? 'border-ink' : 'border-border'}`}
          >
            {img.url ? (
              <OptimizedImage src={img.url} widths={[80, 160]} sizes="80px" alt="" className="w-full aspect-[4/5] object-cover" />
            ) : (
              <PlaceholderImage label={`${i + 1}`} className="w-full aspect-square" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="touch-pan-y"
          style={{ touchAction: 'pan-y pinch-zoom' }}
          role="region"
          aria-label={`${title} image gallery`}
          tabIndex={slides.length > 1 ? 0 : undefined}
          onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } }}
          onPointerDown={(e) => {
            if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
            gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            const start = gesture.current;
            gesture.current = null;
            if (!start || start.id !== e.pointerId || slides.length < 2) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { gesture.current = null; }}
          onLostPointerCapture={() => { gesture.current = null; }}
        >
        {active.url ? (
          <button type="button" onClick={() => setFullscreen(true)} className="group relative block w-full cursor-zoom-in" aria-label={`Open ${title} image ${activeIndex + 1} fullscreen`}><OptimizedImage draggable={false} src={active.url} widths={[480, 720, 960, 1280]} sizes="(max-width: 768px) 100vw, 50vw" loading="eager" alt={`${title} — image ${activeIndex + 1}`} className="w-full aspect-[4/5] object-cover select-none" /><span className="absolute bottom-4 right-4 border border-border bg-background/90 px-3 py-2 text-xs uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View image</span></button>
        ) : (
          <PlaceholderImage label={title} className="w-full aspect-[4/5]" />
        )}
        </div>

        <div ref={thumbnailRail} className="relative flex md:hidden gap-2 mt-3 overflow-x-auto py-1" aria-label="Product image thumbnails">
          {slides.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View ${title} image ${i + 1}`}
              aria-pressed={i === activeIndex}
              className={`w-16 h-16 shrink-0 border-2 ${i === activeIndex ? 'border-ink' : 'border-border'}`}
            >
              {img.url ? <OptimizedImage src={img.url} widths={[64, 128]} sizes="64px" alt="" className="w-full h-full object-cover" /> : <PlaceholderImage label={`${i + 1}`} className="w-full h-full" />}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">Image {activeIndex + 1} of {slides.length}</p>
      </div>
      {fullscreen && active.url && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${title} fullscreen image`} onMouseDown={event => { if (event.target === event.currentTarget) setFullscreen(false); }}><button type="button" onClick={() => setFullscreen(false)} aria-label="Close fullscreen image" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-white/40 text-2xl text-white hover:bg-white hover:text-ink">×</button>{slides.length > 1 && <button type="button" onClick={() => move(-1)} aria-label="Previous image" className="absolute left-4 flex h-12 w-12 items-center justify-center border border-white/40 text-3xl text-white hover:bg-white hover:text-ink">‹</button>}<OptimizedImage src={active.url} widths={[960, 1440, 1920, 2400]} sizes="100vw" loading="eager" alt={`${title} — image ${activeIndex + 1}`} className="max-h-full max-w-full object-contain" />{slides.length > 1 && <button type="button" onClick={() => move(1)} aria-label="Next image" className="absolute right-4 flex h-12 w-12 items-center justify-center border border-white/40 text-3xl text-white hover:bg-white hover:text-ink">›</button>}<p className="absolute bottom-4 text-xs text-white/70">{activeIndex + 1} / {slides.length}</p></div>}
    </div>
  );
}
