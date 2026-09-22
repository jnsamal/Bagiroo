import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import MegaMenu from './MegaMenu';
import HeaderSearch from './HeaderSearch';
import { useWebsite } from '../../lib/useWebsite';
import { resolveMediaUrl } from '../../lib/media';

// Nav items confirmed from the live site audit — no dropdown arrows,
// Shop by Video / Store Locator link directly (no mega menu).
const DEFAULT_NAV_ITEMS = [
  { key: 'new-arrivals', label: 'New Arrivals', to: '/new-arrivals', megaMenu: true },
  { key: 'best-sellers', label: 'Best Sellers', to: '/best-sellers', megaMenu: true },
  { key: 'shop-by-category', label: 'Shop by Category', to: '/shop/categories', megaMenu: true },
  { key: 'featured-collections', label: 'Featured Collections', to: '/collections/featured-collection', megaMenu: true },
  { key: 'gifting', label: 'Gifting', to: '/gifting', megaMenu: true },
  { key: 'shop-by-video', label: 'Shop by Video', to: '/shop-by-video', megaMenu: false },
  { key: 'store-locator', label: 'Store Locator', to: '/store-locator', megaMenu: false },
];

function HeaderIcon({ name }) {
  const paths = {
    account: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    cart: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function MainHeader() {
  const website = useWebsite();
  const NAV_ITEMS = website.navigation ? website.navigation.filter(item => item.visible) : DEFAULT_NAV_ITEMS;
  const [openKey, setOpenKey] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTrigger = useRef(null);
  const closeSearch = () => { setSearchOpen(false); searchTrigger.current?.focus(); };
  const hoverTimer = useRef(null);
  const cancelHover = () => { clearTimeout(hoverTimer.current); hoverTimer.current = null; };
  const openImmediately = (key) => { cancelHover(); if (key) setSearchOpen(false); setOpenKey(key); };
  const scheduleHover = (key, delay = 160) => {
    cancelHover();
    hoverTimer.current = setTimeout(() => { hoverTimer.current = null; if (key) setSearchOpen(false); setOpenKey(key); }, delay);
  };
  const location = useLocation();
  useEffect(() => {
    cancelHover();
    setOpenKey(null);
    setMobileOpen(false);
    setSearchOpen(Boolean(location.state?.openSearch));
    return () => clearTimeout(hoverTimer.current);
  }, [location.pathname, location.search]);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart'),
    staleTime: 10_000,
  });
  const cartCount = (cart?.items || []).reduce((sum, i) => sum + i.quantity, 0);

  const { data: navigation, isLoading: menuLoading, isError: menuError, refetch: retryMenu } = useQuery({
    queryKey: ['navigation'],
    queryFn: () => api.get('/navigation'),
    staleTime: 30_000,
  });

  const menuItemsFor = (key) => navigation?.[key] || [];
  const viewAllHrefFor = (_key, to) => to;
  return (
    <header onMouseLeave={() => scheduleHover(null, 120)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) openImmediately(null); }} className="store-header border-b border-border bg-background relative z-50 xl:z-30" onKeyDown={(e) => { if (e.key === 'Escape') { const trigger = e.currentTarget.querySelector(`[data-menu-trigger="${openKey}"]`); trigger?.focus(); openImmediately(null); setMobileOpen(false); } }}>
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 py-5">
        <button type="button" className="header-action xl:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => { setSearchOpen(false); setMobileOpen(!mobileOpen); }}>
          <span className={`hamburger-icon ${mobileOpen ? 'is-open' : ''}`} aria-hidden="true"><span /><span /><span /></span>
        </button>
        <Link to="/" className="shrink-0" aria-label="Bagiroo and Co. home">
          <img src={resolveMediaUrl(website.logoUrl || '/images/bagiroo-logo.png')} alt={website.siteName || 'Bagiroo & Co.'} width="725" height="136" style={{ '--logo-width': `${website.logoWidth || 180}px` }} className="store-logo h-auto" />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden xl:flex items-center gap-5 2xl:gap-7 text-xs"
        >
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              onMouseEnter={() => item.megaMenu && scheduleHover(item.key)}
              onMouseLeave={cancelHover}
              onFocus={() => item.megaMenu && openImmediately(item.key)}
            >
              <NavLink data-menu-trigger={item.key} aria-expanded={item.megaMenu ? openKey === item.key : undefined} aria-controls={item.megaMenu && openKey === item.key ? `mega-${item.key}` : undefined} to={item.to} className="nav-link" onMouseEnter={() => !item.megaMenu && scheduleHover(null)} onFocus={() => !item.megaMenu && openImmediately(null)}>
                <span className="nav-link-label">{item.label}</span>
              </NavLink>

              {item.megaMenu && openKey === item.key && (
                <div onMouseEnter={cancelHover} id={`mega-${item.key}`} className="absolute inset-x-0 top-full z-20 w-full bg-background before:absolute before:bottom-full before:h-6 before:w-full">
                  <MegaMenu
                    items={menuItemsFor(item.key)}
                    viewAllHref={viewAllHrefFor(item.key, item.to)}
                    isLoading={menuLoading}
                    isError={menuError}
                    onRetry={retryMenu}
                    onNavigate={() => openImmediately(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/account" className="header-action hidden sm:flex" aria-label="Account"><HeaderIcon name="account" /></Link>
          <button ref={searchTrigger} type="button" className="header-action" aria-label="Search" aria-expanded={searchOpen} aria-controls={searchOpen ? 'header-search' : undefined} onClick={() => { openImmediately(null); setMobileOpen(false); setSearchOpen(!searchOpen); }}><HeaderIcon name="search" /></button>
          <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="header-action relative">
            <HeaderIcon name="cart" />
            <span className="absolute -top-2 -right-2 bg-ink text-background text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
      <nav id="mobile-navigation" aria-label="Mobile navigation" aria-hidden={!mobileOpen} inert={!mobileOpen ? '' : undefined} className={`mobile-menu-panel ${mobileOpen ? 'is-open' : ''} absolute inset-x-0 top-full z-50 bg-background xl:hidden border-t border-b border-border px-5 py-4 max-h-[70dvh] overflow-y-auto overscroll-contain`}>
        {NAV_ITEMS.map((item) => <div key={item.key}>
          <div className="flex items-center border-b border-border">
            <NavLink to={item.to} className="flex-1 block py-3 text-sm">{item.label}</NavLink>
            {item.megaMenu && <button type="button" className="header-action" aria-label={`Toggle ${item.label} sublinks`} aria-expanded={openKey === item.key} aria-controls={`mobile-${item.key}`} onClick={() => setOpenKey(openKey === item.key ? null : item.key)}>{openKey === item.key ? '−' : '+'}</button>}
          </div>
          {item.megaMenu && openKey === item.key && <div id={`mobile-${item.key}`}><MegaMenu items={menuItemsFor(item.key)} viewAllHref={item.to} isLoading={menuLoading} isError={menuError} onRetry={retryMenu} onNavigate={() => { setOpenKey(null); setMobileOpen(false); }} /></div>}
        </div>)}
        <Link to="/account" className="block py-3 text-sm">My account</Link>
      </nav>
      <HeaderSearch open={searchOpen} initialQuery={location.state?.searchQuery || ''} onClose={closeSearch} />
    </header>
  );
}



