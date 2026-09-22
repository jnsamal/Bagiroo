// Flat, no-shadow status labels -- color communicates state without
// introducing badge/pill chrome the brand system doesn't use elsewhere.
const STATUS_MAP = {
  PENDING: { label: 'Awaiting payment', className: 'text-amber-700' },
  PAID: { label: 'Payment confirmed', className: 'text-ink' },
  PROCESSING: { label: 'Processing', className: 'text-amber-700' },
  SHIPPED: { label: 'Shipped to customer', className: 'text-green-700' },
  DELIVERED: { label: 'Delivered', className: 'text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'text-red-700' },
  REFUNDED: { label: 'Refunded', className: 'text-muted' },
};

export default function OrderStatusLabel({ status }) {
  const entry = STATUS_MAP[status] || { label: status, className: 'text-muted' };
  return <span className={entry.className}>{entry.label}</span>;
}
