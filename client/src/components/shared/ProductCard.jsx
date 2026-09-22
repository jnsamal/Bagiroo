import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media';
import { formatPrice } from '../../lib/money';
import PlaceholderImage from './PlaceholderImage';

// Shared across the storefront; colour swatches determine the cart variation.
export default function ProductCard({ product }) {
  const queryClient = useQueryClient();
  const [selectedColourId, setSelectedColourId] = useState(null);
  const hasVariations = (product.variations || []).length > 0;
  const selectedColour = product.variations?.find(v => v.id === selectedColourId) || product.variations?.find(v => v.isDefault) || product.variations?.[0];
  const priceMinor = selectedColour?.priceMinor ?? product.priceMinor;
  const compareAtMinor = selectedColour?.compareAtMinor ?? product.compareAtMinor;
  const price = formatPrice(priceMinor);
  const { data: detail } = useQuery({ queryKey: ['product', product.slug], queryFn: () => api.get(`/products/${product.slug}`), enabled: Boolean(selectedColour && !selectedColour.imageUrl) });
  const image = selectedColour ? selectedColour.imageUrl || detail?.media?.find(media => media.variationId === selectedColour.id)?.url || product.media?.find(media => media.variationId === selectedColour.id)?.url : product.media?.[0]?.url;
  const productHref = `/product/${product.slug}${selectedColour ? `?colour=${encodeURIComponent(selectedColour.id)}` : ''}`;

  const addToCartMutation = useMutation({
    mutationFn: (variationId) => api.post('/cart/items', { productId: product.id, variationId, quantity: 1 }),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  function handleCtaClick(e) {
    e.preventDefault();
    addToCartMutation.mutate(selectedColour?.id);
  }

  return (
    <article className="group product-card min-w-0 h-full flex flex-col">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface">
      <Link to={productHref} className="block h-full">
        {image ? (
          <img loading="lazy" src={resolveMediaUrl(image)} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage label={product.title} className="w-full h-full" />
        )}

      </Link>
      </div>

      <Link to={productHref} className="block mt-3 text-sm min-h-10 line-clamp-2">
        {product.title}
      </Link>
      <p className="text-sm mt-2 min-h-10 flex content-start flex-wrap gap-x-2 gap-y-1">
        {compareAtMinor > priceMinor && price !== null && <del className="text-muted">{formatPrice(compareAtMinor)}</del>}
        {price ?? <span className="text-muted">Price unavailable</span>}
      </p>

      <div className="h-10 mt-1 overflow-x-auto overflow-y-hidden" aria-label={hasVariations ? 'Product colours' : undefined}>
      {hasVariations && (
        <div className="flex flex-nowrap gap-1">
          {product.variations.map((v) => (
            <button
              type="button"
              key={v.id}
              title={v.colorName}
              aria-label={`Show ${v.colorName || v.sku}`}
              aria-pressed={selectedColour?.id === v.id}
              onClick={() => { setSelectedColourId(v.id); addToCartMutation.reset(); }}
              className="w-8 h-8 flex items-center justify-center"
            ><span className={`w-4 h-4 rounded-full border border-border ${selectedColour?.id === v.id ? 'ring-1 ring-ink ring-offset-2' : ''}`} style={{ backgroundColor: v.colorHex || '#eee' }} /></button>
          ))}
        </div>
      )}
      </div>
      <button
        type="button"
        className="mt-auto w-full min-h-10 bg-ink text-background text-xs uppercase tracking-wide py-3 disabled:opacity-50"
        onClick={handleCtaClick}
        disabled={addToCartMutation.isPending || price === null}
      >
        {addToCartMutation.isPending ? 'Adding…' : 'Add to Cart'}
      </button>
      <div aria-live="polite" className="min-h-6">
        {addToCartMutation.isSuccess && <p className="mt-2 text-xs">Added to cart.</p>}
        {addToCartMutation.isError && <p role="alert" className="mt-2 text-xs text-red-700">{addToCartMutation.error.message}</p>}
      </div>
    </article>
  );
}
