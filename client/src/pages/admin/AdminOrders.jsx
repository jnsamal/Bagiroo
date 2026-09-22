import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders') });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Orders</h1>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Order</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data?.map((order) => (
            <tr key={order.id}>
              <td className="p-3">#{order.orderNumber}</td>
              <td className="p-3">{order.user?.name || order.guestEmail || '—'}</td>
              <td className="p-3">{formatPrice(order.totalMinor)}</td>
              <td className="p-3">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                  className="border border-gray-300 px-2 py-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3">
                <Link to={`/admin/orders/${order.id}`} className="underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
