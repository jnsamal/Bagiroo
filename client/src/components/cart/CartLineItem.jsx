import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import PlaceholderImage from '../shared/PlaceholderImage';
import { resolveMediaUrl } from '../../lib/media';

export default function CartLineItem({ item }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(item.quantity);
  const price = item.variation?.priceMinor ?? item.product.priceMinor;
  const image = item.product.media?.[0]?.url;

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
    <div className="flex gap-4 py-4 border-b border-border">
      <div className="w-20 h-20 shrink-0">
        {image ? (
          <img src={resolveMediaUrl(image)} alt={item.product.title} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage label={item.product.title} className="w-full h-full" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm">{item.product.title}</p>
        {item.variation && <p className="text-xs text-muted">{item.variation.colorName}</p>}
        <p className="text-sm mt-1">{formatPrice(price) ?? 'Price unavailable'}</p>

        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => changeQuantity(quantity - 1)} className="border border-border w-7 h-7">
            −
          </button>
          <span className="text-sm w-4 text-center">{quantity}</span>
          <button onClick={() => changeQuantity(quantity + 1)} className="border border-border w-7 h-7">
            +
          </button>
          <button onClick={() => removeMutation.mutate()} className="text-xs text-muted underline ml-4">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
