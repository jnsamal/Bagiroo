import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, csrfFetch } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media';

// Product-level image gallery manager: upload, remove, and reorder.
// Upload goes straight to the multipart /admin/media endpoint rather than
// the JSON api helper, since it needs FormData.
export default function AdminProductMedia({ productId, media, variations = [] }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploadColour, setUploadColour] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['navigation'] });
  }

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      if (uploadColour) formData.append('variationId', uploadColour);
      const res = await csrfFetch('/api/v1/admin/media', { method: 'POST', body: formData });
      const body = await res.json();
      if (!body.success) throw new Error(body.error?.message || 'Upload failed.');
      return body.data;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/media/${id}`),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sortOrder }) => api.patch(`/admin/media/${id}`, { sortOrder }),
    onSuccess: invalidate,
  });
  const coverMutation = useMutation({
    mutationFn: ({ id, sortOrder }) => api.patch(`/admin/media/${id}`, { sortOrder }),
    onSuccess: invalidate,
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, variationId }) => api.patch(`/admin/media/${id}`, { variationId: variationId || null }),
    onSuccess: invalidate,
  });
  const altTextMutation = useMutation({
    mutationFn: ({ id, altText }) => api.patch(`/admin/media/${id}`, { altText }),
    onSuccess: invalidate,
  });

  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder);

  function moveImage(index, direction) {
    const target = sorted[index + direction];
    if (!target) return;
    const current = sorted[index];
    reorderMutation.mutate({ id: current.id, sortOrder: target.sortOrder });
    reorderMutation.mutate({ id: target.id, sortOrder: current.sortOrder });
  }

  return (
    <div>
      <h2 className="font-medium mb-1">Product images</h2>
      <p className="mb-4 text-xs text-muted">The first image is the storefront cover. Add a short description so screen-reader users can understand each image.</p>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((item, i) => (
          <div key={item.id} className="border border-gray-200 p-2">
            <div className="relative mb-3"><img src={resolveMediaUrl(item.url)} alt={item.altText || ''} className="w-full aspect-square object-cover" /><span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">Position {i + 1}</span></div>
            <label className="mb-3 block text-xs font-medium">Image description<input defaultValue={item.altText || ''} placeholder="e.g. Black tote bag, front view" onBlur={event => { const altText = event.target.value.trim(); if (altText !== (item.altText || '')) altTextMutation.mutate({ id: item.id, altText }); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} className="mt-1 w-full border border-border px-2 py-2 text-xs" /></label>
            {variations.length > 0 && <select aria-label="Image colour" value={item.variationId || ''} onChange={(e) => assignMutation.mutate({ id: item.id, variationId: e.target.value })} className="w-full border border-gray-300 text-xs py-1 mb-2" disabled={assignMutation.isPending}>
              <option value="">Unassigned</option>
              {variations.map((v) => <option key={v.id} value={v.id}>{v.colorName || v.sku}</option>)}
            </select>}
            <button type="button" disabled={i === 0 || coverMutation.isPending} onClick={() => coverMutation.mutate({ id: item.id, sortOrder: (sorted[0]?.sortOrder ?? 0) - 1 })} className={`mb-2 w-full border px-2 py-1.5 text-xs ${i === 0 ? 'border-ink bg-ink text-background' : 'border-border hover:border-ink'}`}>{i === 0 ? 'Cover image' : 'Set as cover image'}</button>
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <div className="flex gap-2">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="underline disabled:opacity-30">
                  Move earlier
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === sorted.length - 1} className="underline disabled:opacity-30">
                  Move later
                </button>
              </div>
              <button type="button" onClick={() => { const confirmed = window.confirm(`Remove ${item.altText ? `“${item.altText}”` : 'this product image'}?\n\nIt will disappear from the product gallery. This action cannot be undone.`); if (confirmed) deleteMutation.mutate(item.id); }} className="text-red-600">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {variations.length > 0 && <label className="block text-sm mb-3">Upload images for colour
        <select value={uploadColour} onChange={(e) => setUploadColour(e.target.value)} className="block border border-gray-300 px-3 py-2 mt-1">
          <option value="">Unassigned</option>
          {variations.map((v) => <option key={v.id} value={v.id}>{v.colorName || v.sku}</option>)}
        </select>
        <span className="text-xs text-gray-500">Only images assigned to the selected colour appear in its storefront gallery.</span>
      </label>}
      {[assignMutation, deleteMutation, reorderMutation, coverMutation, altTextMutation].map((mutation, i) => mutation.isError && <p key={i} role="alert" className="text-xs text-red-600">{mutation.error.message}</p>)}
      <input
        ref={fileInputRef}
        id={`product-media-upload-${productId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => e.target.files[0] && uploadMutation.mutate(e.target.files[0])}
        className="sr-only"
      />
      <label htmlFor={`product-media-upload-${productId}`} className={`inline-flex border border-ink bg-white px-4 py-2 text-sm font-medium hover:bg-ink hover:text-white ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>{uploadMutation.isPending ? 'Uploading…' : 'Add product image'}</label>
      <p className="mt-2 text-xs text-muted">JPG, PNG or WebP files.</p>
      {uploadMutation.isPending && <p className="text-xs text-gray-500 mt-1">Uploading your image…</p>}
      {uploadMutation.isError && <p className="text-xs text-red-600 mt-1">{uploadMutation.error.message}</p>}
    </div>
  );
}
