import { useEffect, useRef, useState } from 'react';
import PlaceholderImage from '../shared/PlaceholderImage';
import { resolveMediaUrl } from '../../lib/media';

// Desktop thumbnail rail; mobile thumbnails and horizontal swipe navigation.
export default function ProductGallery({ images = [], title }) {
  const [activeIndex, setActiveIndex] = useState(0);
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
              <img src={resolveMediaUrl(img.url)} alt="" className="w-full aspect-square object-cover" />
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
          <img draggable={false} src={resolveMediaUrl(active.url)} alt={`${title} — image ${activeIndex + 1}`} className="w-full aspect-square object-cover select-none" />
        ) : (
          <PlaceholderImage label={title} className="w-full aspect-square" />
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
              {img.url ? <img loading="lazy" src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" /> : <PlaceholderImage label={`${i + 1}`} className="w-full h-full" />}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">Image {activeIndex + 1} of {slides.length}</p>
      </div>
    </div>
  );
}
