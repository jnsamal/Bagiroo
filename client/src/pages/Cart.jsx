import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import CartLineItem from '../components/cart/CartLineItem';
import CouponInput from '../components/cart/CouponInput';
import OrderSummary from '../components/cart/OrderSummary';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';
import { usePublicSettings } from '../lib/useWebsite';

export default function Cart() {
  const settings = usePublicSettings();
  const { data: cart, isLoading, isError, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart'),
  });

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  if (!cart.items.length) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-24 text-center" data-scroll-reveal>
        <p className="mb-4 text-xs uppercase tracking-[.2em] text-muted">Your bag</p>
        <h1 className="section-title mb-3">Your cart is empty</h1>
        <p className="text-muted mb-8">Explore our latest bags and find something made for your everyday.</p>
        <Link to="/shop" className="store-button border border-ink bg-ink text-background">Shop now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-12 md:py-16" data-scroll-reveal>
      <div className="mb-10 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Your bag</p><h1 className="section-title">Shopping cart</h1></div>
        <span className="text-sm text-muted">{cart.items.reduce((total, item) => total + item.quantity, 0)} items</span>
      </div>

      {cart.hasUnpriceableItems && (
        <p className="text-sm text-red-700 mb-4">
          One or more items in your cart don't have a price set yet and won't be included in checkout.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-14">
        <div>
          {cart.items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary cart={cart} />
          <CouponInput appliedCoupon={cart.appliedCoupon} />
          <Link
            to="/checkout"
            className="store-button mt-6 w-full border border-ink bg-ink text-background"
          >
            Checkout
          </Link>
          <div className={`mt-5 grid gap-2 border-t border-border pt-5 text-center text-xs text-muted ${settings?.returnsEnabled === false ? 'grid-cols-2' : 'grid-cols-3'}`}><span>Secure payment</span>{settings?.returnsEnabled !== false && <span>Easy returns</span>}<span>Order support</span></div>
        </aside>
      </div>
    </div>
  );
}
