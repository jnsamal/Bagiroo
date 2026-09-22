import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AnnouncementBar from './AnnouncementBar';
import MainHeader from './MainHeader';
import Footer from './Footer';
import WhatsAppLauncher from './WhatsAppLauncher';

// Standard layout-route pattern (one <Routes> tree, <Outlet/> for the
// matched child) -- replaces an earlier nested-<Routes> approach that
// worked but made the routing structure harder to reason about.
export default function StorefrontLayout() {
  const { data: settings } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => api.get('/settings/public'),
  });
  const { data: homepage } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => api.get('/homepage'),
    staleTime: 60_000,
  });
  useEffect(() => {
    if (!settings?.website) return;
    document.title = settings.website.siteName;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = settings.website.metaDescription;
  }, [settings]);

  const theme = {};
  for (const key of ['background', 'surface', 'ink', 'muted', 'border']) {
    const hex = settings?.website?.[key];
    if (/^#[0-9a-f]{6}$/i.test(hex || '')) theme[`--brand-${key}`] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ');
  }
  if (settings?.website?.fontFamily) theme.fontFamily = `${settings.website.fontFamily}, sans-serif`;
  return (
    <div style={theme} className="min-h-screen flex flex-col bg-background text-ink">
      <AnnouncementBar messages={homepage?.announcements || []} />
      <MainHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer socialLinks={settings?.socialLinks || []} />
      <WhatsAppLauncher phoneNumber={settings?.whatsappNumber} />
    </div>
  );
}
