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
    onSuccess: () => { refreshSettings(); queryClient.invalidateQueries({ queryKey: ['navigation'] }); },
  });
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    if (data) setWhatsapp(data.whatsappNumber);
    if (data) setGiftingSlug(data.giftingCollectionSlug);
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
    <div className="max-w-lg space-y-10">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {[saveWhatsapp, saveSocialLink, addAnnouncement, deleteAnnouncement].map((mutation, index) => mutation.isError && <p key={index} role="alert" className="text-sm text-red-700">{mutation.error.message}</p>)}
      <section>
        <label htmlFor="gifting-collection" className="block font-medium mb-3">Gifting collection</label>
        <div className="flex gap-3">
          <select id="gifting-collection" value={giftingSlug} onChange={(e) => setGiftingSlug(e.target.value)} className="border border-gray-300 px-3 py-2 flex-1">
            <option value="">No collection selected</option>
            {(collections || []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button disabled={saveGifting.isPending} onClick={() => saveGifting.mutate()} className="bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        </div>
        {saveGifting.isError && <p role="alert" className="text-red-600 text-sm mt-2">{saveGifting.error.message}</p>}
        {saveGifting.isSuccess && <p role="status" className="text-sm mt-2">Gifting collection saved.</p>}
      </section>

      <section>
        <h2 className="font-medium mb-3">WhatsApp business number</h2>
        <p className="text-xs text-gray-500 mb-2">Digits only, international format (e.g. 919999999999) — used to build the wa.me link.</p>
        <div className="flex gap-3">
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="border border-gray-300 px-3 py-2 flex-1" />
          <button onClick={() => saveWhatsapp.mutate(whatsapp)} className="bg-gray-900 text-white px-4 py-2 text-sm">
            Save
          </button>
        </div>
      </section>

      <section>
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

      <section>
        <h2 className="font-medium mb-3">Announcement bar</h2>
        <div className="flex gap-3 mb-4">
          <input
            placeholder="New announcement message"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="border border-gray-300 px-3 py-2 flex-1 text-sm"
          />
          <button onClick={() => announcementText && addAnnouncement.mutate(announcementText)} className="bg-gray-900 text-white px-4 py-2 text-sm">
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {data?.announcements.map((a) => (
            <li key={a.id} className="flex justify-between text-sm border border-gray-200 p-3">
              <span>{a.message}</span>
              <button onClick={() => deleteAnnouncement.mutate(a.id)} className="text-red-600 underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

