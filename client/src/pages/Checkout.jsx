import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { loadRazorpayScript } from '../lib/loadRazorpay';
import OrderSummary from '../components/cart/OrderSummary';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import ErrorState from '../components/shared/ErrorState';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' };

function AddressFields({ value, onChange }) {
  return <div className="space-y-4">
    <input required placeholder="Full name" value={value.fullName} onChange={(e) => onChange('fullName', e.target.value)} className="w-full border border-border px-3 py-2" />
    <input required placeholder="Phone" value={value.phone} onChange={(e) => onChange('phone', e.target.value)} className="w-full border border-border px-3 py-2" />
    <input required placeholder="Address line 1" value={value.line1} onChange={(e) => onChange('line1', e.target.value)} className="w-full border border-border px-3 py-2" />
    <input placeholder="Address line 2 (optional)" value={value.line2 || ''} onChange={(e) => onChange('line2', e.target.value)} className="w-full border border-border px-3 py-2" />
    <div className="grid grid-cols-2 gap-4">
      <input required placeholder="City" value={value.city} onChange={(e) => onChange('city', e.target.value)} className="min-w-0 border border-border px-3 py-2" />
      <input required placeholder="State" value={value.state} onChange={(e) => onChange('state', e.target.value)} className="min-w-0 border border-border px-3 py-2" />
    </div>
    <input required placeholder="Postal code" value={value.postalCode} onChange={(e) => onChange('postalCode', e.target.value)} className="w-full border border-border px-3 py-2" />
  </div>;
}

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [address, setAddress] = useState(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [makeDefault, setMakeDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
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

  const { data: savedAddresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/account/addresses'),
    enabled: Boolean(me),
  });

  useEffect(() => {
    if (!me || isLoadingAddresses) return;
    if (!savedAddresses?.length) {
      setShowNewAddress(true);
      setNewAddress(current => ({ ...current, fullName: current.fullName || me.user.name || '', phone: current.phone || me.user.phone || '' }));
      return;
    }
    const selected = savedAddresses.find(item => item.id === selectedAddressId) || savedAddresses.find(item => item.isDefault) || savedAddresses[0];
    setSelectedAddressId(selected.id);
    setAddress({ fullName: selected.fullName, phone: selected.phone, line1: selected.line1, line2: selected.line2 || '', city: selected.city, state: selected.state, postalCode: selected.postalCode, country: selected.country || 'IN' });
  }, [me, savedAddresses, selectedAddressId, isLoadingAddresses]);

  const { data: cart, isLoading, isError, error } = useQuery({
    queryKey: ['checkout-validate'],
    queryFn: () => api.post('/checkout/validate', {}),
  });

  function updateField(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function selectAddress(item) {
    setSelectedAddressId(item.id);
    setAddress({ fullName: item.fullName, phone: item.phone, line1: item.line1, line2: item.line2 || '', city: item.city, state: item.state, postalCode: item.postalCode, country: item.country || 'IN' });
    setShowNewAddress(false);
    setAddressError('');
  }

  async function saveNewAddress() {
    setAddressError('');
    setIsSavingAddress(true);
    try {
      const created = await api.post('/account/addresses', { ...newAddress, label: 'Home', isDefault: makeDefault });
      queryClient.setQueryData(['addresses'], current => [created, ...(current || []).filter(item => item.id !== created.id)]);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      selectAddress(created);
      setNewAddress({ ...emptyAddress, fullName: me?.user?.name || '', phone: me?.user?.phone || '' });
      setMakeDefault(false);
    } catch (err) {
      setAddressError(err.message);
    } finally {
      setIsSavingAddress(false);
    }
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
        prefill: { name: address.fullName, contact: address.phone, email: me?.user?.email || guestEmail },
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

          {!me ? <fieldset className="space-y-4">
            <legend className="font-medium mb-2">Shipping address</legend>
            <AddressFields value={address} onChange={updateField} />
          </fieldset> : <fieldset>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><legend className="font-medium">Shipping address</legend><button type="button" onClick={() => { setShowNewAddress(current => !current); setAddressError(''); }} className="text-sm underline underline-offset-4">{showNewAddress ? 'Cancel' : '+ Add new address'}</button></div>
            {isLoadingAddresses ? <LoadingSkeleton className="h-32" /> : <div className="space-y-3">{savedAddresses?.map(item => <label key={item.id} className={`block cursor-pointer border p-4 transition-colors ${selectedAddressId === item.id && !showNewAddress ? 'border-ink bg-surface' : 'border-border hover:border-ink'}`}>
              <input type="radio" name="savedAddress" value={item.id} checked={selectedAddressId === item.id && !showNewAddress} onChange={() => selectAddress(item)} className="sr-only" />
              <span className="flex items-center justify-between gap-3"><strong>{item.label || 'Address'}</strong>{item.isDefault && <span className="bg-ink px-2 py-1 text-xs uppercase text-background">Default</span>}</span>
              <span className="mt-2 block text-sm text-muted">{item.fullName} · {item.phone}</span>
              <span className="mt-1 block text-sm text-muted">{item.line1}{item.line2 ? `, ${item.line2}` : ''}, {item.city}, {item.state} {item.postalCode}</span>
            </label>)}</div>}
            {showNewAddress && <div className="mt-5 border border-border p-5">
              <h2 className="mb-4 text-lg font-medium">Add new address</h2>
              <AddressFields value={newAddress} onChange={(field, value) => setNewAddress(current => ({ ...current, [field]: value }))} />
              <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={makeDefault} onChange={event => setMakeDefault(event.target.checked)} /> Make this my default address</label>
              <button type="button" onClick={saveNewAddress} disabled={isSavingAddress} className="store-button mt-5 bg-ink text-background disabled:opacity-50">{isSavingAddress ? 'Saving…' : 'Save and use this address'}</button>
              {addressError && <p role="alert" className="mt-3 text-sm text-red-700">{addressError}</p>}
            </div>}
          </fieldset>}

          {placeOrderError && <p className="text-sm text-red-700">{placeOrderError}</p>}

          <button
            type="submit"
            disabled={isPlacingOrder || (Boolean(me) && !selectedAddressId)}
            className="w-full bg-ink text-background py-4 uppercase text-sm tracking-wide disabled:opacity-50"
          >
            {isPlacingOrder ? 'Processing…' : me && !selectedAddressId ? 'Save an address to continue' : 'Place order & pay'}
          </button>
        </div>

        <div>
          <OrderSummary cart={cart} />
        </div>
      </form>
    </div>
  );
}
