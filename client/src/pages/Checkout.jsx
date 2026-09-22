import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { loadRazorpayScript } from '../lib/loadRazorpay';
import OrderSummary from '../components/cart/OrderSummary';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' };

export default function Checkout() {
  const navigate = useNavigate();
  const [address, setAddress] = useState(emptyAddress);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState('');

  // No dedicated "am I logged in" hook exists yet in this foundation build --
  // /auth/me returning successfully is the signal. A 401 here just means
  // guest checkout, which is expected and not an error state to show.
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
  });

  const { data: cart, isLoading, isError, error } = useQuery({
    queryKey: ['checkout-validate'],
    queryFn: () => api.post('/checkout/validate', {}),
  });

  function updateField(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setPlaceOrderError('');
    setIsPlacingOrder(true);

    try {
      const { order, providerOrderId, razorpayKeyId } = await api.post('/orders', {
        guestEmail: me ? undefined : guestEmail,
        guestPhone: me ? undefined : guestPhone,
        shippingAddress: address,
      });

      if (!providerOrderId || !razorpayKeyId) {
        // Razorpay isn't configured in this environment yet -- the order
        // exists as PENDING; go straight to confirmation rather than
        // pretending a payment step happened.
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPlaceOrderError('Could not load the payment gateway. Please try again.');
        setIsPlacingOrder(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.totalMinor,
        currency: order.currency,
        name: 'Bagiroo & Co.',
        order_id: providerOrderId,
        prefill: { name: address.fullName, contact: address.phone, email: guestEmail },
        handler: async (response) => {
          try {
            await api.post(`/orders/${order.id}/verify-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/order-confirmation/${order.id}`);
          } catch (err) {
            setPlaceOrderError(err.message);
          }
        },
        modal: {
          ondismiss: () => setIsPlacingOrder(false),
        },
      });

      rzp.open();
    } catch (err) {
      setPlaceOrderError(err.message);
      setIsPlacingOrder(false);
    }
  }

  if (isLoading) return <LoadingSkeleton className="h-96 m-6" />;
  if (isError) return <ErrorState message={error.message} />;

  if (!cart.canCheckout) {
    return (
      <div className="max-w-screen-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-3">Nothing to check out</h1>
        <p className="text-muted">
          {cart.hasUnpriceableItems
            ? 'One or more items in your cart need a price set before you can check out.'
            : 'Your cart is empty.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          {!me && (
            <fieldset className="space-y-4">
              <legend className="font-medium mb-2">Contact information</legend>
              <input
                type="email"
                required
                placeholder="Email address"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full border border-border px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full border border-border px-3 py-2"
              />
            </fieldset>
          )}

          <fieldset className="space-y-4">
            <legend className="font-medium mb-2">Shipping address</legend>
            <input required placeholder="Full name" value={address.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full border border-border px-3 py-2" />
            <input required placeholder="Phone" value={address.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full border border-border px-3 py-2" />
            <input required placeholder="Address line 1" value={address.line1} onChange={(e) => updateField('line1', e.target.value)} className="w-full border border-border px-3 py-2" />
            <input placeholder="Address line 2 (optional)" value={address.line2} onChange={(e) => updateField('line2', e.target.value)} className="w-full border border-border px-3 py-2" />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="City" value={address.city} onChange={(e) => updateField('city', e.target.value)} className="border border-border px-3 py-2" />
              <input required placeholder="State" value={address.state} onChange={(e) => updateField('state', e.target.value)} className="border border-border px-3 py-2" />
            </div>
            <input required placeholder="Postal code" value={address.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className="w-full border border-border px-3 py-2" />
          </fieldset>

          {placeOrderError && <p className="text-sm text-red-700">{placeOrderError}</p>}

          <button
            type="submit"
            disabled={isPlacingOrder}
            className="w-full bg-ink text-background py-4 uppercase text-sm tracking-wide disabled:opacity-50"
          >
            {isPlacingOrder ? 'Processing…' : 'Place order & pay'}
          </button>
        </div>

        <div>
          <OrderSummary cart={cart} />
        </div>
      </form>
    </div>
  );
}
