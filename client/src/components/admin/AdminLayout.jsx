import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import LoadingSkeleton from '../shared/LoadingSkeleton';

export const ADMIN_SECTIONS = [
  { group: 'Overview', links: [{ to: '/admin', label: 'Dashboard', description: 'Store overview and management shortcuts', end: true }] },
  { group: 'Store', links: [
    { to: '/admin/products', label: 'Products', description: 'Products, pricing, colours, photos and best sellers' },
    { to: '/admin/content/inventory', label: 'Inventory', description: 'Product and colour stock quantities' },
    { to: '/admin/content/categories', label: 'Categories', description: 'Category names, images, visibility and order' },
    { to: '/admin/content/collections', label: 'Collections', description: 'Curated products, images and featured collections' },
    { to: '/admin/orders', label: 'Orders', description: 'Customer orders and fulfilment statuses' },
    { to: '/admin/returns', label: 'Returns', description: 'Return requests and refund records' },
    { to: '/admin/coupons', label: 'Coupons', description: 'Discount codes, amounts and availability' },
  ] },
  { group: 'Website', links: [
    { to: '/admin/website', label: 'Website editor', description: 'Logo, colours, homepage, policies and checkout' },
    { to: '/admin/content/videos', label: 'Videos', description: 'Product videos, posters and captions' },
    { to: '/admin/content/instagram', label: 'Instagram', description: 'Social photographs and post links' },
    { to: '/admin/content/announcements', label: 'Announcements', description: 'Announcement messages, links, schedules and order' },
    { to: '/admin/content/contacts', label: 'Contact messages', description: 'Read and manage customer enquiries' },
    { to: '/admin/testimonials', label: 'Testimonials', description: 'Homepage customer stories and ratings' },
    { to: '/admin/content/reviews', label: 'Product reviews', description: 'Customer ratings, reviews and approval' },
    { to: '/admin/settings', label: 'Site settings', description: 'Announcements, social links, WhatsApp and gifting' },
  ] },
  { group: 'Account', links: [{ to: '/admin/security', label: 'Security', description: 'Change your admin password' }] },
];
export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me, isLoading, isError } = useQuery({ queryKey: ['admin-me'], queryFn: () => api.get('/admin/me'), retry: false, staleTime: 0 });
  const logout = useMutation({ mutationFn: () => api.post('/admin/logout', {}), onSuccess: () => { queryClient.clear(); navigate('/admin/login', { replace: true }); } });
  if (isLoading) return <LoadingSkeleton className="h-screen" />;
  if (isError || !me) return <Navigate to="/admin/login" replace />;
  return <div className="admin-shell min-h-screen bg-[#f5f5f2] text-gray-900 lg:flex">
    <aside className="lg:w-64 shrink-0 bg-ink text-background lg:min-h-screen lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-white/10"><Link to="/admin" className="text-xl font-semibold">Bagiroo <span className="text-xs font-normal text-white/60">Admin</span></Link><button type="button" className="lg:hidden text-sm" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button></div>
      <nav id="admin-sidebar" aria-label="Admin navigation" className={`${menuOpen ? 'block' : 'hidden'} lg:block px-4 py-5 space-y-6`}>{ADMIN_SECTIONS.map(section => <div key={section.group}><p className="px-3 text-[10px] uppercase tracking-widest text-white/40 mb-2">{section.group}</p>{section.links.map(link => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>{link.label}</NavLink>)}</div>)}</nav>
    </aside>
    <div className="flex-1 min-w-0"><header className="bg-white border-b border-border px-5 sm:px-8 py-4 flex flex-wrap justify-between items-center gap-4"><p className="text-sm text-muted">Signed in as <span className="text-ink font-medium">{me.user.name || me.user.loginId}</span></p><div className="flex gap-5 items-center text-sm"><a href="/" target="_blank" rel="noreferrer" className="hover:underline">View website ↗</a><button type="button" disabled={logout.isPending} onClick={() => logout.mutate()} className="underline">Sign out</button></div>{logout.isError && <p role="alert" className="text-red-700">{logout.error.message}</p>}</header><main className="p-5 sm:p-8 lg:p-10 max-w-screen-2xl mx-auto"><Outlet /></main></div>
  </div>;
}
