import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

export default function AccountDashboard() {
  const { data: me, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me'),
  });
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/account/addresses'),
  });
  const { data: orders, isLoading } = useQuery({
    queryKey: ['account-orders'],
    queryFn: () => api.get('/account/orders'),
  });

  const profileItems = [
    { label: 'Name', complete: Boolean(me?.user?.name?.trim()), to: '/account/details' },
    { label: 'Email address', complete: Boolean(me?.user?.email?.trim()), to: '/account/details' },
    { label: 'Mobile number', complete: Boolean(me?.user?.phone?.trim()), to: '/account/security' },
    { label: 'Delivery address', complete: Boolean(addresses?.length), to: '/account/addresses' },
  ];
  const completedItems = profileItems.filter(item => item.complete).length;
  const completion = Math.round((completedItems / profileItems.length) * 100);
  const nextItem = profileItems.find(item => !item.complete);

  return (
    <div>
      {!isLoadingProfile && !isLoadingAddresses && completion < 100 && <section className="mb-10 border border-border p-6 md:p-8" aria-labelledby="profile-completion-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="profile-completion-title" className="text-xl font-semibold">Profile completion</h2>
            <p className="mt-1 text-sm text-muted">{completion === 100 ? 'Your profile is complete.' : `${completedItems} of ${profileItems.length} details completed`}</p>
          </div>
          <strong className="text-2xl font-semibold" aria-hidden="true">{completion}%</strong>
        </div>
        <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Profile completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
          <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${completion}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{nextItem ? `Next: add your ${nextItem.label.toLowerCase()}.` : 'Everything is ready for a faster checkout.'}</p>
          {nextItem && <Link to={nextItem.to} className="text-sm font-medium underline underline-offset-4">Complete profile</Link>}
        </div>
      </section>}
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
