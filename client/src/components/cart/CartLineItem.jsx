import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import PlaceholderImage from '../shared/PlaceholderImage';
import { resolveMediaUrl } from '../../lib/media';

export default function CartLineItem({ item }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(item.quantity);
  const price = item.product.hasColorVariations
    ? (item.variation?.priceMinor ?? item.product.priceMinor)
    : item.product.priceMinor;
  const image = item.variation?.imageUrl || item.product.media?.find(media => media.variationId === item.variation?.id)?.url || item.product.media?.[0]?.url;

  const updateMutation = useMutation({
    mutationFn: (qty) => api.patch(`/cart/items/${item.id}`, { quantity: qty }),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  const removeMutation = useMutation({
    mutationFn: () => api.delete(`/cart/items/${item.id}`),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  function changeQuantity(next) {
    if (next < 0) return;
    setQuantity(next);
    updateMutation.mutate(next);
  }

  return (
    <div className="flex gap-5 py-5 border-b border-border">
      <div className="w-24 h-28 sm:w-28 sm:h-32 shrink-0 bg-surface">
        {image ? (
          <img src={resolveMediaUrl(image)} alt={item.product.title} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage label={item.product.title} className="w-full h-full" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-medium leading-snug">{item.product.title}</p>
        {item.variation && <p className="mt-1 text-sm text-muted">Colour: {item.variation.colorName}</p>}
        <p className="mt-2 font-medium">{formatPrice(price) ?? 'Price unavailable'}</p>

        <div className="flex items-center gap-3 mt-2">
          <button type="button" aria-label={`Decrease quantity of ${item.product.title}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => changeQuantity(quantity - 1)} className="border border-border w-9 h-9 disabled:opacity-40">
            −
          </button>
          <span className="text-sm w-4 text-center">{quantity}</span>
          <button type="button" aria-label={`Increase quantity of ${item.product.title}`} disabled={updateMutation.isPending} onClick={() => changeQuantity(quantity + 1)} className="border border-border w-9 h-9 disabled:opacity-40">
            +
          </button>
          <button type="button" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()} className="text-xs text-muted underline underline-offset-4 ml-auto disabled:opacity-50">
            {removeMutation.isPending ? 'Removing…' : 'Remove'}
          </button>
        </div>
        {(updateMutation.isError || removeMutation.isError) && <p role="alert" className="mt-2 text-xs text-red-700">{updateMutation.error?.message || removeMutation.error?.message}</p>}
      </div>
    </div>
  );
}
