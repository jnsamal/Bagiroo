import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

export default function AccountDashboard() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['account-orders'],
    queryFn: () => api.get('/account/orders'),
  });

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-medium mb-6">Recent orders</h2>
      {isLoading && <LoadingSkeleton className="h-48" />}
      {orders && !orders.length && <div className="border border-border p-8 md:p-12"><p className="text-muted text-base">No orders yet.</p><Link to="/shop" className="store-button bg-ink text-background mt-6">Start shopping</Link></div>}
      {orders && orders.length > 0 && (
        <div className="divide-y divide-border border border-border mb-6">
          {orders.slice(0, 3).map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`} className="flex flex-wrap justify-between gap-4 p-6 md:p-8 text-base hover:bg-surface transition-colors">
              <span>#{order.orderNumber}</span>
              <span className="flex gap-4">
                <span className="uppercase text-sm text-muted">{order.status}</span>
                <span>{formatPrice(order.totalMinor)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
      {orders && orders.length > 3 && (
        <Link to="/account/orders" className="text-base underline">
          View all orders
        </Link>
      )}
    </div>
  );
}
