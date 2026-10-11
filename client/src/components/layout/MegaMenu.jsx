import { useState } from 'react';
import { Link } from 'react-router-dom';
import { safeUrl } from '../../lib/safeUrl';
import OptimizedImage from '../shared/OptimizedImage';

export default function MegaMenu({ items = [], viewAllHref = '/shop', viewAllImageUrl = '', isLoading, isError, onRetry, onNavigate }) {
  const [activeSlug, setActiveSlug] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const viewAllItem = { slug: '__view-all__', label: 'View all', to: viewAllHref, imageUrl: viewAllImageUrl };
  const active = activeSlug === viewAllItem.slug ? viewAllItem : items.find((item) => item.slug === activeSlug) || items[0] || viewAllItem;
  return (
    <div className="w-full bg-background border-t border-b border-border px-5 sm:px-8 lg:px-12 py-6">
      {isLoading ? <p role="status" className="text-sm text-muted py-6">Loading menu…</p> : isError ? <div role="alert" className="text-sm py-6">Could not load the menu. <button type="button" className="underline" onClick={onRetry}>Try again</button></div> : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,1fr)_270px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {items.length ? <ul className="max-h-[50vh] overflow-y-auto">
              {items.map((item) => <li key={item.slug}>
                <Link to={safeUrl(item.to) || '/shop'} onClick={onNavigate} onMouseEnter={() => setActiveSlug(item.slug)} onFocus={() => setActiveSlug(item.slug)} className={`mega-sublink flex items-center justify-between gap-3 border-b border-border py-3 text-sm ${active?.slug === item.slug ? 'is-active' : ''}`}>
                  <span className="mega-link-label">{item.label}</span><span aria-hidden="true">↗</span>
                </Link>
              </li>)}
            </ul> : <p className="text-sm text-muted py-3">No items available yet.</p>}
            <Link to={safeUrl(viewAllHref) || '/shop'} onClick={onNavigate} onMouseEnter={() => setActiveSlug(viewAllItem.slug)} onFocus={() => setActiveSlug(viewAllItem.slug)} className="mt-5 inline-flex items-center gap-2 border-b border-ink pb-1 text-sm font-medium transition-opacity hover:opacity-60">
              View all <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {active && <Link to={safeUrl(active.to) || '/shop'} onClick={onNavigate} className="mega-sublink block" aria-label={`Explore ${active.label}`}>
            <div className="aspect-square bg-surface overflow-hidden">
              {active.imageUrl && failedUrl !== active.imageUrl ? <OptimizedImage key={active.imageUrl} src={active.imageUrl} widths={[320, 480, 640]} sizes="320px" alt={active.label} onError={() => setFailedUrl(active.imageUrl)} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center p-6 text-center text-sm text-muted">{active.label}<br />Image unavailable</div>}
            </div>
            <p className="mt-3 text-sm"><span className="mega-link-label">{active.label}</span></p>
          </Link>}
        </div>
      )}
    </div>
  );
}
