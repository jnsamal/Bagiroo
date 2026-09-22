import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, csrfFetch } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import { resolveMediaUrl } from '../../lib/media';

const emptyForm = { sku: '', colorName: '', colorHex: '#171716', priceMinor: '', compareAtMinor: '' };

// Colour-variation manager: add/edit/remove variations, and upload a
// dedicated image per colour (stored on ProductVariation.imageUrl, used
// for swatch previews and mega-menu thumbnails).
export default function AdminProductVariations({ productId, variations }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['navigation'] });
  }

  const createMutation = useMutation({
    mutationFn: (body) => api.post(`/admin/products/${productId}/variations`, body),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/admin/products/${productId}/variations/${id}`, body),
    onSuccess: () => { invalidate(); setEditingId(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${productId}/variations/${id}`),
    onSuccess: invalidate,
  });

  async function uploadVariationImage(variationId, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('variationId', variationId);
    const res = await csrfFetch('/api/v1/admin/media', { method: 'POST', body: formData });
    const body = await res.json();
    if (!body.success) throw new Error(body.error?.message || 'Upload failed.');
    if (!variations.find(variation => variation.id === variationId)?.imageUrl) await api.patch(`/admin/products/${productId}/variations/${variationId}`, { imageUrl: body.data.url });
    invalidate();
  }

  return (
    <div>
      <h2 className="font-medium mb-3">Colours / Variations</h2>

      <div className="space-y-3 mb-6">
        {variations.map((v) => (
          <div key={v.id} className="border border-gray-200 p-4 flex gap-4 items-center">
            <div className="w-16 h-16 shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
              {v.imageUrl ? (
                <img src={resolveMediaUrl(v.imageUrl)} alt={v.colorName} className="w-full h-full object-cover" />
              ) : (
                <span className="w-6 h-6 border border-gray-300" style={{ backgroundColor: v.colorHex || '#eee' }} />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{v.colorName || '(no colour name)'} — Variation ID: {v.sku}</p>
              <p className="text-gray-500">
                {formatPrice(v.priceMinor) ?? 'No price set'}
                {v.compareAtMinor ? ` (was ${formatPrice(v.compareAtMinor)})` : ''}
              </p>
              <label className="text-xs underline cursor-pointer mt-1 inline-block">
                Add colour image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files[0]; if (file) { setUploadError(''); uploadVariationImage(v.id, file).catch((err) => setUploadError(err.message)); } e.target.value = ''; }}
                />
              </label>
            </div>
            <button type="button" onClick={() => { setEditingId(v.id); setForm({ sku: v.sku, colorName: v.colorName || '', colorHex: v.colorHex || '#171716', priceMinor: v.priceMinor ?? '', compareAtMinor: v.compareAtMinor ?? '' }); }} className="underline text-xs self-start">Edit</button>
            <button type="button" onClick={() => deleteMutation.mutate(v.id)} className="text-red-600 text-xs self-start">
              Remove
            </button>
          </div>
        ))}
      </div>
      {uploadError && <p role="alert" className="text-red-600 text-sm">{uploadError}</p>}
      {[createMutation, updateMutation, deleteMutation].map((mutation, i) => mutation.isError && <p key={i} role="alert" className="text-red-600 text-sm">{mutation.error.message}</p>)}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body = {
            ...form,
            priceMinor: form.priceMinor === '' ? null : Number(form.priceMinor),
            compareAtMinor: form.compareAtMinor === '' ? null : Number(form.compareAtMinor),
          };
          if (editingId) updateMutation.mutate({ id: editingId, body });
          else createMutation.mutate(body);
        }}
        className="flex flex-wrap gap-2 items-end border-t border-gray-200 pt-4"
      >
        <input required aria-label="Variation ID" placeholder="Variation ID" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-36" />
        <input placeholder="Colour name" value={form.colorName} onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-32" />
        <input type="color" value={form.colorHex} onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))} className="border border-gray-300 w-10 h-10" />
        <input placeholder="Price (minor units)" type="number" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-36" />
        <input placeholder="Compare-at (minor units)" type="number" value={form.compareAtMinor} onChange={(e) => setForm((f) => ({ ...f, compareAtMinor: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-36" />
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 text-sm">
          {editingId ? 'Save colour' : 'Add colour'}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-sm underline">Cancel</button>}
      </form>
    </div>
  );
}
