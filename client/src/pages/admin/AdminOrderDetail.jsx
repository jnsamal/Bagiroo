import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['admin-order', id], queryFn: () => api.get(`/admin/orders/${id}`) });

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!data) return null;

  const shipping = data.addresses.find((a) => a.type === 'SHIPPING');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Order #{data.orderNumber}</h1>
      <p className="text-sm text-gray-500 mb-8">{data.status}</p>

      <table className="w-full text-sm border border-gray-200 mb-8">
        <tbody className="divide-y divide-gray-100">
          {data.items.map((item) => (
            <tr key={item.id}>
              <td className="p-3">{item.titleSnapshot} × {item.quantity}</td>
              <td className="p-3 text-right">{formatPrice(item.priceMinor * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {shipping && (
        <div className="mb-8 text-sm">
          <p className="font-medium mb-1">Ship to</p>
          <p>{shipping.fullName} — {shipping.phone}</p>
          <p>{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ''}</p>
          <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
        </div>
      )}

      <div>
        <p className="font-medium mb-2 text-sm">Status history</p>
        <ul className="text-sm text-gray-500 space-y-1">
          {data.statusHistory.map((h) => (
            <li key={h.id}>{new Date(h.createdAt).toLocaleString()} — {h.status}{h.note ? `: ${h.note}` : ''}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
