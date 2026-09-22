import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatPrice } from '../lib/money';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';

// Public-ish confirmation: works for guest checkouts too, so this
// deliberately does NOT require auth -- it's reachable right after
// placing an order regardless of login state. Full order history lives
// behind /account/orders for logged-in users.
export default function OrderConfirmation() {
  const { orderId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: () => api.get(`/account/orders/${orderId}`).catch(() => null),
  });

  if (isLoading) return <LoadingSkeleton className="h-64 m-6" />;

  // Guests can't hit the authenticated /account/orders endpoint -- for a
  // foundation build we show a generic confirmation rather than the full
  // order detail in that case, and note it as a Phase 5 gap.
  if (isError || !data) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-3">Thank you for your order</h1>
        <p className="text-muted mb-2">Order reference: {orderId}</p>
        <p className="text-muted text-sm">
          A guest order confirmation lookup isn't implemented yet in this foundation build --
          see docs/known-limitations.md. Check your email for order details once notifications
          are configured.
        </p>
        <Link to="/shop" className="inline-block mt-6 bg-ink text-background px-6 py-3 text-sm uppercase tracking-wide">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Thank you, your order is confirmed</h1>
      <p className="text-muted mb-8">Order #{data.orderNumber} -- status: {data.status}</p>

      <div className="border border-border divide-y divide-border">
        {data.items.map((item) => (
          <div key={item.id} className="flex justify-between p-4 text-sm">
            <span>{item.titleSnapshot} × {item.quantity}</span>
            <span>{formatPrice(item.priceMinor * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm space-y-1 text-right">
        <p>Subtotal: {formatPrice(data.subtotalMinor)}</p>
        {data.discountMinor > 0 && <p>Discount: -{formatPrice(data.discountMinor)}</p>}
        <p>Shipping: {data.shippingMinor === 0 ? 'Free' : formatPrice(data.shippingMinor)}</p>
        <p className="font-medium">Total: {formatPrice(data.totalMinor)}</p>
      </div>

      <Link to="/shop" className="inline-block mt-8 bg-ink text-background px-6 py-3 text-sm uppercase tracking-wide">
        Continue shopping
      </Link>
    </div>
  );
}
