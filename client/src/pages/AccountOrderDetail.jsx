import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';

export default function AccountOrderDetail() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['account-order', id],
    queryFn: () => api.get(`/account/orders/${id}`),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  const shipping = data.addresses.find((a) => a.type === 'SHIPPING');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Order #{data.orderNumber}</h1>
      <p className="text-sm uppercase text-muted mb-8">{data.status}</p>

      <div className="border border-border divide-y divide-border mb-8">
        {data.items.map((item) => (
          <div key={item.id} className="flex justify-between p-4 text-sm">
            <span>{item.titleSnapshot} × {item.quantity}</span>
            <span>{formatPrice(item.priceMinor * item.quantity)}</span>
          </div>
        ))}
      </div>

      {shipping && (
        <div className="mb-8 text-sm">
          <p className="font-medium mb-1">Shipping to</p>
          <p>{shipping.fullName}</p>
          <p>{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ''}</p>
          <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
        </div>
      )}

      <div>
        <p className="font-medium mb-2 text-sm">Status history</p>
        <ul className="text-sm text-muted space-y-1">
          {data.statusHistory.map((h) => (
            <li key={h.id}>
              {new Date(h.createdAt).toLocaleString()} — {h.status}
              {h.note ? `: ${h.note}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
