import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';

export const ADMIN_SECTIONS = [
  { group: 'Overview', links: [{ to: '/admin', label: 'Dashboard', description: 'Store overview and management shortcuts', end: true }] },
  { group: 'Products', links: [
    { to: '/admin/products', label: 'Products', description: 'Products, pricing, colours, photos and best sellers' },
    { to: '/admin/content/inventory', label: 'Stock levels', description: 'Product and colour stock quantities' },
    { to: '/admin/content/categories', label: 'Categories', description: 'Category names, images, visibility and order' },
    { to: '/admin/content/collections', label: 'Collections', description: 'Curated products, images and featured collections' },
  ] },
  { group: 'Sales and customers', links: [
    { to: '/admin/orders', label: 'Orders', description: 'Customer orders and fulfilment statuses' },
    { to: '/admin/customers', label: 'Customers', description: 'Customer profiles, addresses and purchase history' },
    { to: '/admin/returns', label: 'Returns', description: 'Return requests and refund records' },
    { to: '/admin/coupons', label: 'Coupons', description: 'Discount codes, amounts and availability' },
    { to: '/admin/content/contacts', label: 'Messages', description: 'Read and manage customer enquiries' },
    { to: '/admin/content/reviews', label: 'Product reviews', description: 'Customer ratings, reviews and approval' },
  ] },
  { group: 'Website content', links: [
    { to: '/admin/website', label: 'Website editor', description: 'Logo, colours, homepage, policies and checkout' },
    { to: '/admin/content/videos', label: 'Videos', description: 'Product videos, posters and captions' },
    { to: '/admin/content/instagram', label: 'Instagram', description: 'Social photographs and post links' },
    { to: '/admin/content/announcements', label: 'Announcements', description: 'Announcement messages, links, schedules and order' },
    { to: '/admin/testimonials', label: 'Customer stories', description: 'Homepage customer stories and ratings' },
  ] },
  { group: 'Settings', links: [
    { to: '/admin/settings', label: 'Store settings', description: 'Social links, WhatsApp and gifting' },
  ] },
];
export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { data: me, isLoading, isError, error } = useQuery({ queryKey: ['admin-me'], queryFn: () => api.get('/admin/me'), retry: false, staleTime: 0 });
  const signOut = useMutation({ mutationFn: logout, onSuccess: () => { queryClient.clear(); navigate('/', { replace: true }); } });
  if (isLoading) return <LoadingSkeleton className="h-screen" />;
  if (isError && error?.status === 403) return <Navigate to="/account" state={{ adminAccessDenied: true }} replace />;
  if (isError || !me) return <Navigate to="/login" replace />;
  const activeLink = ADMIN_SECTIONS.flatMap(section => section.links)
    .filter(link => link.end ? location.pathname === link.to : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0] || ADMIN_SECTIONS[0].links[0];
  return <div className="admin-shell min-h-screen bg-[#f5f5f2] text-gray-900 lg:flex">
    <a href="#admin-main" className="sr-only fixed left-4 top-4 z-[100] bg-white px-4 py-3 text-sm font-medium text-ink shadow-lg focus:not-sr-only">Skip to admin content</a>
    <aside className="lg:w-64 shrink-0 bg-ink text-background lg:min-h-screen lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-white/10"><Link to="/admin" className="text-xl font-semibold">Bagiroo <span className="text-xs font-normal text-white/60">Admin</span></Link><button type="button" className="lg:hidden text-sm" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button></div>
      <nav id="admin-sidebar" aria-label="Admin navigation" className={`${menuOpen ? 'block' : 'hidden'} lg:block px-4 py-5 space-y-7`}>{ADMIN_SECTIONS.map(section => <div key={section.group}><p className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/45 mb-2">{section.group}</p><div className="space-y-1">{section.links.map(link => <NavLink key={link.to} to={link.to} end={link.end} title={link.description} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block border px-3 py-2.5 text-sm transition-colors ${isActive ? 'border-white bg-white font-medium text-ink' : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white'}`}>{link.label}</NavLink>)}</div></div>)}</nav>
    </aside>
    <div className="flex-1 min-w-0"><header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-border px-5 sm:px-8 py-4 flex flex-wrap justify-between items-center gap-4"><div className="flex min-w-0 items-center gap-3 text-sm"><nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2"><Link to="/admin" className="text-muted underline-offset-4 hover:text-ink hover:underline">Dashboard</Link>{activeLink.to !== '/admin' && <><span aria-hidden="true" className="text-border">/</span><span aria-current="page" className="truncate font-medium text-ink">{activeLink.label}</span></>}</nav><span aria-hidden="true" className="hidden text-border sm:inline">·</span><span className="hidden text-muted sm:inline">Signed in as <span className="font-medium text-ink">{me.user.name || user?.name || me.user.loginId}</span>{(me.user.email || user?.email) && <span className="ml-1">({me.user.email || user.email})</span>}</span></div><div className="flex gap-5 items-center text-sm"><a href="/" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">View website ↗</a><button type="button" disabled={signOut.isPending} onClick={() => signOut.mutate()} className="underline underline-offset-4 disabled:opacity-50">{signOut.isPending ? 'Signing out…' : 'Sign out'}</button></div>{signOut.isError && <p role="alert" className="w-full text-sm text-red-700">{signOut.error.message}</p>}</header><main id="admin-main" tabIndex="-1" className="p-5 sm:p-8 lg:p-10 max-w-screen-2xl mx-auto"><Outlet /></main></div>
  </div>;
}
