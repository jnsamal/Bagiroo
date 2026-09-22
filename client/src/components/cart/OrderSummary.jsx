import { formatPrice } from '../../lib/money';
import { useWebsite } from '../../lib/useWebsite';

export default function OrderSummary({ cart }) {
  const website = useWebsite();
  return (
    <div className="border border-border p-6 text-sm space-y-2">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatPrice(cart.subtotalMinor)}</span>
      </div>
      {cart.discountMinor > 0 && (
        <div className="flex justify-between text-green-700">
          <span>Discount</span>
          <span>-{formatPrice(cart.discountMinor)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{cart.shippingMinor === 0 ? 'Free' : formatPrice(cart.shippingMinor)}</span>
      </div>
      {cart.taxMinor > 0 && (
        <div className="flex justify-between">
          <span>{website.taxIncluded !== false ? 'Tax (included)' : 'Tax'}</span>
          <span>{formatPrice(cart.taxMinor)}</span>
        </div>
      )}
      <div className="flex justify-between font-medium pt-2 border-t border-border">
        <span>Total</span>
        <span>{formatPrice(cart.totalMinor)}</span>
      </div>
    </div>
  );
}
