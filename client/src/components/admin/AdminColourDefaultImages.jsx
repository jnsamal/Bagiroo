import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media';

export default function AdminColourDefaultImages({ productId, variations = [], media = [] }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: ({ variationId, mediaId }) => api.patch(`/admin/products/${productId}/variations/${variationId}`, { defaultImageMediaId: mediaId }),
    onSuccess: () => { ['admin-product', 'admin-products', 'product', 'products', 'homepage', 'navigation'].forEach(key => queryClient.invalidateQueries({ queryKey: [key] })); },
  });
  return <section>
    <h2 className="text-xl font-semibold mb-2">Default image per colour</h2>
    <p className="text-sm text-muted mb-6">Choose the photo shown first when a customer selects a colour. Selections save automatically.</p>
    <div className="space-y-6">{variations.map(variation => {
      const images = media.filter(image => image.variationId === variation.id).sort((a, b) => a.sortOrder - b.sortOrder);
      const chosen = images.find(image => image.url === variation.imageUrl);
      const current = chosen || images[0];
      return <div key={variation.id} className="border border-border bg-white p-4">
        <h3 className="font-medium mb-3">{variation.colorName || variation.sku}</h3>
        {images.length ? <>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">{images.map(image => <button key={image.id} type="button" disabled={save.isPending} aria-label={`Set ${variation.colorName || variation.sku} default image: ${image.altText || 'photo'} ${images.indexOf(image) + 1}`} aria-pressed={current?.id === image.id} onClick={() => { save.reset(); save.mutate({ variationId: variation.id, mediaId: image.id }); }} className={`border-2 p-1 text-xs ${current?.id === image.id ? 'border-ink' : 'border-border hover:border-ink'}`}>
            <img src={resolveMediaUrl(image.url)} alt={image.altText || variation.colorName || ''} className="w-full aspect-square object-cover" />
            <span className="block py-2">{current?.id === image.id ? 'Default image' : 'Set as default'}</span>
          </button>)}</div>
          {chosen && <button type="button" disabled={save.isPending} onClick={() => save.mutate({ variationId: variation.id, mediaId: '' })} className="text-xs underline mt-3">Use gallery order instead</button>}
        </> : <p className="text-sm text-muted">Assign or upload images for this colour in the Images section first.</p>}
      </div>;
    })}</div>
    {!variations.length && <p className="text-sm text-muted">Add colour variations to choose default images.</p>}
    {save.isPending && <p role="status" className="text-sm mt-3">Saving default image…</p>}
    {save.isSuccess && <p role="status" className="text-sm mt-3">Default image saved.</p>}
    {save.isError && <p role="alert" className="text-sm text-red-700 mt-3">{save.error.message}</p>}
  </section>;
}
