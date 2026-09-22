import { useState } from 'react';
import { formatPrice } from '../../lib/money';
import PlaceholderImage from '../shared/PlaceholderImage';
import { resolveMediaUrl } from '../../lib/media';
import OrderStatusLabel from './OrderStatusLabel';

// Structure follows the reference dashboard (order number, product count,
// status/placed-on/delivered-to/total meta rows, product thumbnail grid,
// download-invoice action) -- rebuilt with Bagiroo's flat brand styling
// (square corners, thin borders, no shadows) and only the fields our data
// model actually has. The reference's "Date of delivery" becomes "Placed
// on" here since we track order-creation time, not a delivery-date
// estimate; "Size" is omitted since only colour variations exist in the
// catalog.
export default function OrderCard({ order, customerName }) {
  const shipping = order.addresses?.find((a) => a.type === 'SHIPPING');
  const [invoiceState, setInvoiceState] = useState('idle');

  async function handleDownloadInvoice() {
    setInvoiceState('loading');
    try {
      const response = await fetch(`/api/v1/account/orders/${order.id}/invoice`, { credentials: 'include' });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error?.message || 'Invoice download failed.'); }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Bagiroo-Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      setInvoiceState('idle');
    } catch (_error) {
      setInvoiceState('error');
    }
  }

  return (
    <div className="border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-medium">Order #{order.orderNumber}</p>
          <p className="text-xs text-muted mt-1">
            {order.items.length} product{order.items.length !== 1 ? 's' : ''}
            {customerName ? ` \u00b7 By ${customerName}` : ''}
          </p>
        </div>
        <button
          onClick={handleDownloadInvoice}
          disabled={invoiceState === 'loading'}
          className="text-xs border border-border px-3 py-2 uppercase tracking-wide whitespace-nowrap"
        >
          {invoiceState === 'loading' ? 'Preparing…' : 'Download invoice'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-6">
        <p>
          <span className="text-muted">Status: </span>
          <OrderStatusLabel status={order.status} />
        </p>
        <p>
          <span className="text-muted">Placed on: </span>
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {shipping && (
          <p className="col-span-2">
            <span className="text-muted">Delivered to: </span>
            {shipping.line1}, {shipping.city}
          </p>
        )}
        <p className="col-span-2 font-medium">
          <span className="text-muted font-normal">Total: </span>
          {formatPrice(order.totalMinor)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {order.items.map((item) => {
          const image = item.product?.media?.[0]?.url;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="w-14 h-14 shrink-0">
                {image ? (
                  <img src={resolveMediaUrl(image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <PlaceholderImage label="" className="w-full h-full" />
                )}
              </div>
              <div className="text-xs">
                <p>{item.titleSnapshot}</p>
                <p className="text-muted mt-1">Quantity: {item.quantity}x = {formatPrice(item.priceMinor * item.quantity)}</p>
                {item.variation?.colorName && <p className="text-muted">Color: {item.variation.colorName}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {invoiceState === 'error' && <p role="alert" className="text-xs text-red-700 mt-4">Invoice download failed. Please try again.</p>}
    </div>
  );
}
