import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, csrfFetch } from '../../lib/api';
import { formatPrice, majorInputToMinor, minorToMajorInput } from '../../lib/money';
import { resolveMediaUrl } from '../../lib/media';

const emptyForm = { sku: '', colorName: '', colorHex: '#171716', priceMinor: '', compareAtMinor: '' };

// Colour-variation manager: add/edit/remove variations, and upload a
// dedicated image per colour (stored on ProductVariation.imageUrl, used
// for swatch previews and mega-menu thumbnails).
export default function AdminProductVariations({ productId, variations, media = [] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [priceError, setPriceError] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
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

  const defaultImageMutation = useMutation({
    mutationFn: ({ variationId, mediaId }) => api.patch(`/admin/products/${productId}/variations/${variationId}`, { defaultImageMediaId: mediaId }),
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
        {variations.map((v) => {
          const colourImages = media.filter(image => image.variationId === v.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const selectedImage = colourImages.find(image => image.url === v.imageUrl) || colourImages[0];
          return <div key={v.id} className="border border-gray-200 p-4">
            <div className="flex gap-4 items-center">
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
            </div>
            <button type="button" onClick={() => { setPriceError(''); setEditingId(v.id); setForm({ sku: v.sku, colorName: v.colorName || '', colorHex: v.colorHex || '#171716', priceMinor: minorToMajorInput(v.priceMinor), compareAtMinor: minorToMajorInput(v.compareAtMinor) }); }} className="underline text-xs self-start">Edit</button>
            <button type="button" onClick={() => {
              const name = v.colorName || v.sku || 'this colour variation';
              const confirmed = window.confirm(`Remove “${name}”?\n\nCustomers will no longer be able to select this colour. This action cannot be undone.`);
              if (confirmed) deleteMutation.mutate(v.id);
            }} className="text-red-600 text-xs self-start">
              Remove
            </button>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-3 text-xs text-muted">{colourImages.length} {colourImages.length === 1 ? 'image' : 'images'}{colourImages.length ? ' · selected image is shown first for this colour' : ''}</p>
              <div className="flex flex-wrap gap-3">
                {colourImages.map(image => <button key={image.id} type="button" disabled={defaultImageMutation.isPending} onClick={() => defaultImageMutation.mutate({ variationId: v.id, mediaId: image.id })} aria-pressed={selectedImage?.id === image.id} className={`w-24 border p-1 text-xs transition-colors ${selectedImage?.id === image.id ? 'border-ink bg-surface' : 'border-border hover:border-ink'}`}>
                  <img src={resolveMediaUrl(image.url)} alt={image.altText || v.colorName || ''} className="aspect-square w-full object-cover" />
                  <span className="block px-1 py-2">{selectedImage?.id === image.id ? 'Default image' : 'Set as default'}</span>
                </button>)}
                <label className="flex h-[126px] w-24 cursor-pointer flex-col items-center justify-center border border-dashed border-border text-center text-xs text-muted transition-colors hover:border-ink hover:text-ink">
                  <span className="text-xl" aria-hidden="true">↓</span><span className="mt-2">Add image</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { setUploadError(''); uploadVariationImage(v.id, file).catch((err) => setUploadError(err.message)); } e.target.value = ''; }} />
                </label>
              </div>
            </div>
          </div>
        })}
      </div>
      {uploadError && <p role="alert" className="text-red-600 text-sm">{uploadError}</p>}
      {[createMutation, updateMutation, deleteMutation, defaultImageMutation].map((mutation, i) => mutation.isError && <p key={i} role="alert" className="text-red-600 text-sm">{mutation.error.message}</p>)}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPriceError('');
          const priceMinor = majorInputToMinor(form.priceMinor);
          const compareAtMinor = majorInputToMinor(form.compareAtMinor);
          if (Number.isNaN(priceMinor) || Number.isNaN(compareAtMinor)) {
            setPriceError('Enter valid prices in rupees.');
            return;
          }
          if (priceMinor !== null && compareAtMinor !== null && compareAtMinor <= priceMinor) {
            setPriceError('Original price must be greater than the selling price.');
            return;
          }
          const body = {
            ...form,
            priceMinor,
            compareAtMinor,
          };
          if (editingId) updateMutation.mutate({ id: editingId, body });
          else createMutation.mutate(body);
        }}
        className="flex flex-wrap gap-3 items-end border-t border-gray-200 pt-4"
      >
        <input required aria-label="Variation ID" placeholder="Variation ID" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-36" />
        <input placeholder="Colour name" value={form.colorName} onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-32" />
        <input type="color" value={form.colorHex} onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))} className="border border-gray-300 w-10 h-10" />
        <label className="text-xs">Selling price<div className="mt-1 flex border border-gray-300 bg-white focus-within:border-ink"><span className="flex items-center border-r border-gray-300 px-2 text-muted">₹</span><input aria-label="Variation selling price" type="number" min="0" step="0.01" inputMode="decimal" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: e.target.value }))} className="w-28 px-3 py-2 text-sm outline-none" /></div></label>
        <label className="text-xs">Original price<div className="mt-1 flex border border-gray-300 bg-white focus-within:border-ink"><span className="flex items-center border-r border-gray-300 px-2 text-muted">₹</span><input aria-label="Variation original price" type="number" min="0" step="0.01" inputMode="decimal" value={form.compareAtMinor} onChange={(e) => setForm((f) => ({ ...f, compareAtMinor: e.target.value }))} className="w-28 px-3 py-2 text-sm outline-none" /></div></label>
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 text-sm">
          {editingId ? 'Save colour' : 'Add colour'}
        </button>
        {editingId && <button type="button" onClick={() => { setPriceError(''); setEditingId(null); setForm(emptyForm); }} className="text-sm underline">Cancel</button>}
        {priceError && <p role="alert" className="w-full text-sm text-red-600">{priceError}</p>}
      </form>
    </div>
  );
}
