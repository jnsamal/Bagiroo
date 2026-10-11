import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const PLATFORMS = ['instagram', 'facebook', 'pinterest', 'whatsapp'];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  function refreshSettings() { ['admin-settings', 'settings', 'homepage', 'navigation'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); }
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api.get('/admin/settings') });
  const [whatsapp, setWhatsapp] = useState('');
  const [giftingSlug, setGiftingSlug] = useState('');
  const { data: collections } = useQuery({ queryKey: ['admin-collections'], queryFn: () => api.get('/admin/collections') });
  const saveGifting = useMutation({
    mutationFn: () => api.patch('/admin/settings/gifting', { collectionSlug: giftingSlug }),
    onSuccess: refreshSettings,
  });
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    if (!data) return;
    setWhatsapp(data.whatsappNumber);
    setGiftingSlug(data.giftingCollectionSlug);
  }, [data]);

  const saveWhatsapp = useMutation({
    mutationFn: (whatsappNumber) => api.patch('/admin/settings/whatsapp', { whatsappNumber }),
    onSuccess: () => refreshSettings(),
  });

  const saveSocialLink = useMutation({
    mutationFn: (body) => api.put('/admin/settings/social-links', body),
    onSuccess: () => refreshSettings(),
  });

  const addAnnouncement = useMutation({
    mutationFn: (message) => api.post('/admin/settings/announcements', { message, isActive: true }),
    onSuccess: () => {
      refreshSettings();
      setAnnouncementText('');
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id) => api.delete(`/admin/settings/announcements/${id}`),
    onSuccess: () => refreshSettings(),
  });

  function socialUrlFor(platform) {
    return data?.socialLinks.find((s) => s.platform === platform)?.url || '';
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Website</p><h1 className="admin-page-title">Site settings</h1><p className="mt-2 text-sm text-muted">Manage storefront contact channels, gifting and announcements.</p></div>
      {[saveWhatsapp, saveSocialLink, addAnnouncement, deleteAnnouncement].map((mutation, index) => mutation.isError && <p key={index} role="alert" className="text-sm text-red-700">{mutation.error.message}</p>)}
      <section className="admin-panel">
        <label htmlFor="gifting-collection" className="block font-medium mb-3">Gifting collection</label>
        <div className="flex gap-3">
          <select id="gifting-collection" value={giftingSlug} onChange={(e) => setGiftingSlug(e.target.value)} className="border border-gray-300 px-3 py-2 flex-1">
            <option value="">No collection selected</option>
            {(collections || []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button disabled={saveGifting.isPending} onClick={() => saveGifting.mutate()} className="admin-primary disabled:opacity-50">{saveGifting.isPending ? 'Saving…' : 'Save'}</button>
        </div>
        {saveGifting.isError && <p role="alert" className="text-red-600 text-sm mt-2">{saveGifting.error.message}</p>}
        {saveGifting.isSuccess && <p role="status" className="text-sm mt-2">Gifting collection saved.</p>}
      </section>

      <section className="admin-panel">
        <h2 className="font-medium mb-3">WhatsApp business number</h2>
        <p className="text-xs text-gray-500 mb-2">Digits only, international format (e.g. 919999999999) — used to build the wa.me link.</p>
        <div className="flex gap-3">
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="border border-gray-300 px-3 py-2 flex-1" />
          <button disabled={saveWhatsapp.isPending} onClick={() => saveWhatsapp.mutate(whatsapp)} className="admin-primary disabled:opacity-50">
            {saveWhatsapp.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="font-medium mb-3">Social links</h2>
        <div className="space-y-2">
          {PLATFORMS.map((platform) => (
            <div key={platform} className="flex gap-3 items-center">
              <span className="w-20 text-sm capitalize">{platform}</span>
              <input
                defaultValue={socialUrlFor(platform)}
                placeholder="https://…"
                onBlur={(e) => saveSocialLink.mutate({ platform, url: e.target.value, isVisible: Boolean(e.target.value) })}
                className="border border-gray-300 px-3 py-2 flex-1 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="font-medium mb-3">Announcement bar</h2>
        <div className="flex gap-3 mb-4">
          <input
            placeholder="New announcement message"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="border border-gray-300 px-3 py-2 flex-1 text-sm"
          />
          <button disabled={!announcementText.trim() || addAnnouncement.isPending} onClick={() => announcementText && addAnnouncement.mutate(announcementText)} className="admin-primary disabled:opacity-50">
            {addAnnouncement.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        <ul className="space-y-2">
          {data?.announcements.map((a) => (
            <li key={a.id} className="flex justify-between text-sm border border-gray-200 p-3">
              <span>{a.message}</span>
              <button disabled={deleteAnnouncement.isPending} onClick={() => { const confirmed = window.confirm(`Remove this announcement?\n\n“${a.message}”\n\nThis action cannot be undone.`); if (confirmed) deleteAnnouncement.mutate(a.id); }} className="text-red-600 underline underline-offset-4 disabled:opacity-50">
                {deleteAnnouncement.isPending ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

