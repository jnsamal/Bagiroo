import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import OrderCard from '../components/account/OrderCard';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import EmptyState from '../components/shared/EmptyState';

// "Current" = paid and moving toward delivery; "Unpaid" = awaiting
// payment; "All orders" = everything, including cancelled/refunded.
// Mirrors the reference dashboard's three tabs using our actual
// OrderStatus values.
const CURRENT_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED'];
const TABS = [
  { key: 'current', label: 'Current' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'all', label: 'All orders' },
];

export default function AccountOrders() {
  const [tab, setTab] = useState('current');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['account-orders'],
    queryFn: () => api.get('/account/orders'),
  });

  if (isLoading) return <LoadingSkeleton className="h-64" />;
  if (isError) return <ErrorState message={error.message} />;

  const filtered = data.filter((order) => {
    if (tab === 'current') return CURRENT_STATUSES.includes(order.status);
    if (tab === 'unpaid') return order.status === 'PENDING';
    return true;
  });

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm border ${
              tab === t.key ? 'bg-ink text-background border-ink' : 'border-border text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!filtered.length && <EmptyState message="No orders here yet." />}

      <div className="space-y-6">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} customerName={me?.user?.name} />
        ))}
      </div>
    </div>
  );
}
