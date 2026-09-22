import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import CartLineItem from '../components/cart/CartLineItem';
import CouponInput from '../components/cart/CouponInput';
import OrderSummary from '../components/cart/OrderSummary';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';

export default function Cart() {
  const { data: cart, isLoading, isError, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart'),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  if (!cart.items.length) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-3">Your Cart Is Empty</h1>
        <p className="text-muted mb-6">Check out our shop to see what's available</p>
        <Link to="/shop" className="bg-ink text-background px-6 py-3 text-sm uppercase tracking-wide">
          Shop now →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Your Cart</h1>

      {cart.hasUnpriceableItems && (
        <p className="text-sm text-red-700 mb-4">
          One or more items in your cart don't have a price set yet and won't be included in checkout.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          {cart.items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </div>

        <div>
          <OrderSummary cart={cart} />
          <CouponInput appliedCoupon={cart.appliedCoupon} />
          <Link
            to="/checkout"
            className="block text-center bg-ink text-background py-4 uppercase text-sm tracking-wide mt-6"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
