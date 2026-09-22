import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../../lib/media';
import { safeUrl } from '../../lib/safeUrl';

export default function MegaMenu({ items = [], viewAllHref, isLoading, isError, onRetry, onNavigate }) {
  const [activeSlug, setActiveSlug] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const active = items.find((item) => item.slug === activeSlug) || items[0];
  return (
    <div className="w-full bg-background border-t border-b border-border px-5 sm:px-8 lg:px-12 py-6">
      {isLoading ? <p role="status" className="text-sm text-muted py-6">Loading menu…</p> : isError ? <div role="alert" className="text-sm py-6">Could not load the menu. <button type="button" className="underline" onClick={onRetry}>Try again</button></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-8">
          <div>
            {items.length ? <ul className="grid sm:grid-cols-2 gap-x-8 max-h-[50vh] overflow-y-auto">
              {items.map((item) => <li key={item.slug}>
                <Link to={safeUrl(item.to) || '/shop'} onClick={onNavigate} onMouseEnter={() => setActiveSlug(item.slug)} onFocus={() => setActiveSlug(item.slug)} className={`mega-sublink flex items-center justify-between gap-3 border-b border-border py-3 text-sm ${active?.slug === item.slug ? 'is-active' : ''}`}>
                  <span className="mega-link-label">{item.label}</span><span aria-hidden="true">↗</span>
                </Link>
              </li>)}
            </ul> : <p className="text-sm text-muted py-3">No items available yet.</p>}
            {safeUrl(viewAllHref) && <Link to={safeUrl(viewAllHref)} onClick={onNavigate} className="mega-sublink inline-block mt-5 py-2 text-sm"><span className="mega-link-label">View all</span></Link>}
          </div>
          {active && <Link to={safeUrl(active.to) || '/shop'} onClick={onNavigate} className="mega-sublink block" aria-label={`Explore ${active.label}`}>
            <div className="aspect-square bg-surface overflow-hidden">
              {active.imageUrl && failedUrl !== active.imageUrl ? <img key={active.imageUrl} src={resolveMediaUrl(active.imageUrl)} alt={active.label} onError={() => setFailedUrl(active.imageUrl)} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center p-6 text-center text-sm text-muted">{active.label}<br />Image unavailable</div>}
            </div>
            <p className="mt-3 text-sm"><span className="mega-link-label">{active.label}</span></p>
          </Link>}
        </div>
      )}
    </div>
  );
}
