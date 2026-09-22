import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import PlaceholderImage from '../components/shared/PlaceholderImage';
import { resolveMediaUrl } from '../lib/media';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

export default function AccountWishlist() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => api.delete(`/wishlist/items/${productId}`),
    onSuccess: (data) => queryClient.setQueryData(['wishlist'], data),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Wishlist</h1>
      {!data.items.length && <EmptyState message="Nothing saved yet." />}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {data.items.map((item) => {
          const image = item.product.media?.[0]?.url;
          return (
            <div key={item.id}>
              <Link to={`/product/${item.product.slug}`} className="block aspect-square">
                {image ? (
                  <img src={resolveMediaUrl(image)} alt={item.product.title} className="w-full h-full object-cover" />
                ) : (
                  <PlaceholderImage label={item.product.title} className="w-full h-full" />
                )}
              </Link>
              <p className="text-sm mt-2">{item.product.title}</p>
              <p className="text-sm">{formatPrice(item.product.priceMinor) ?? 'Price unavailable'}</p>
              <button onClick={() => removeMutation.mutate(item.product.id)} className="text-xs text-muted underline mt-1">
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
