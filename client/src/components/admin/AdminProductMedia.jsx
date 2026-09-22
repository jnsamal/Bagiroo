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
  const assignMutation = useMutation({
    mutationFn: ({ id, variationId }) => api.patch(`/admin/media/${id}`, { variationId: variationId || null }),
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
      <h2 className="font-medium mb-3">Images</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {sorted.map((item, i) => (
          <div key={item.id} className="border border-gray-200 p-2">
            <img src={resolveMediaUrl(item.url)} alt={item.altText || ''} className="w-full aspect-square object-cover mb-2" />
            {variations.length > 0 && <select aria-label="Image colour" value={item.variationId || ''} onChange={(e) => assignMutation.mutate({ id: item.id, variationId: e.target.value })} className="w-full border border-gray-300 text-xs py-1 mb-2" disabled={assignMutation.isPending}>
              <option value="">Unassigned</option>
              {variations.map((v) => <option key={v.id} value={v.id}>{v.colorName || v.sku}</option>)}
            </select>}
            <div className="flex justify-between text-xs">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === sorted.length - 1} className="disabled:opacity-30">
                  ↓
                </button>
              </div>
              <button type="button" onClick={() => deleteMutation.mutate(item.id)} className="text-red-600">
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
      {[assignMutation, deleteMutation, reorderMutation].map((mutation, i) => mutation.isError && <p key={i} role="alert" className="text-xs text-red-600">{mutation.error.message}</p>)}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => e.target.files[0] && uploadMutation.mutate(e.target.files[0])}
        className="text-sm"
      />
      {uploadMutation.isPending && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
      {uploadMutation.isError && <p className="text-xs text-red-600 mt-1">{uploadMutation.error.message}</p>}
    </div>
  );
}
