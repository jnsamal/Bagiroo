import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import PlaceholderImage from './PlaceholderImage';
import OptimizedImage from './OptimizedImage';

// Shared across the storefront; colour swatches determine the cart variation.
export default function ProductCard({ product }) {
  const queryClient = useQueryClient();
  const [selectedColourId, setSelectedColourId] = useState(null);
  const hasVariations = Boolean(product.hasColorVariations && (product.variations || []).length > 0);
  const selectedColour = hasVariations ? product.variations?.find(v => v.id === selectedColourId) || product.variations?.find(v => v.isDefault) || product.variations?.[0] : null;
  const priceMinor = selectedColour?.priceMinor ?? product.priceMinor;
  const compareAtMinor = selectedColour?.compareAtMinor ?? product.compareAtMinor;
  const price = formatPrice(priceMinor);
  const { data: detail } = useQuery({ queryKey: ['product', product.slug], queryFn: () => api.get(`/products/${product.slug}`), enabled: Boolean(selectedColour && !selectedColour.imageUrl) });
  const image = selectedColour ? selectedColour.imageUrl || detail?.media?.find(media => media.variationId === selectedColour.id)?.url || product.media?.find(media => media.variationId === selectedColour.id)?.url : product.media?.[0]?.url;
  const productHref = `/product/${product.slug}${selectedColour ? `?colour=${encodeURIComponent(selectedColour.id)}` : ''}`;
  const discountPercent = compareAtMinor > priceMinor && priceMinor != null
    ? Math.round((1 - priceMinor / compareAtMinor) * 100)
    : 0;

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
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-surface">
      {discountPercent > 0 && <span className="absolute left-3 top-3 z-10 bg-ink px-2.5 py-1 text-[11px] uppercase tracking-wider text-background">{discountPercent}% off</span>}
      <Link to={productHref} className="block h-full">
        {image ? (
          <OptimizedImage src={image} widths={[240, 360, 480, 640, 800]} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage label={product.title} className="w-full h-full" />
        )}

      </Link>
      </div>

      <Link to={productHref} className="block mt-4 text-sm font-medium min-h-10 line-clamp-2 hover:underline underline-offset-4">
        {product.title}
      </Link>
      <p className="text-sm mt-2 min-h-10 flex content-start flex-wrap gap-x-2 gap-y-1">
        {price ? <span className="font-medium">{price}</span> : <span className="text-muted">Price unavailable</span>}
        {compareAtMinor > priceMinor && price !== null && <del className="text-muted text-xs">{formatPrice(compareAtMinor)}</del>}
      </p>

      <div className="h-10 mt-1 overflow-x-auto overflow-y-hidden" aria-label={hasVariations ? 'Product colours' : undefined}>
      {hasVariations && (
        <div className="flex flex-nowrap gap-1.5">
          {product.variations.map((v) => (
            <button
              type="button"
              key={v.id}
              title={v.colorName}
              aria-label={`Show ${v.colorName || v.sku}`}
              aria-pressed={selectedColour?.id === v.id}
              onClick={() => { setSelectedColourId(v.id); addToCartMutation.reset(); }}
              className="w-9 h-9 flex items-center justify-center rounded-full"
            ><span className={`w-5 h-5 rounded-full border border-border ${selectedColour?.id === v.id ? 'ring-1 ring-ink ring-offset-2' : ''}`} style={{ backgroundColor: v.colorHex || '#eee' }} /></button>
          ))}
        </div>
      )}
      </div>
      <button
        type="button"
        className="store-button mt-auto w-full border border-ink bg-ink text-background disabled:opacity-50"
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
