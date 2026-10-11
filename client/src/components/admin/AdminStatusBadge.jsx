const STATUS_LABELS = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  PROCESSING: 'Preparing order',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  REQUESTED: 'New request',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  ISSUED: 'Refund issued',
  NOT_REQUESTED: 'Not requested',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-900',
  REQUESTED: 'bg-amber-100 text-amber-900',
  PAID: 'bg-blue-100 text-blue-900',
  PROCESSING: 'bg-violet-100 text-violet-900',
  APPROVED: 'bg-blue-100 text-blue-900',
  SHIPPED: 'bg-cyan-100 text-cyan-900',
  DELIVERED: 'bg-green-100 text-green-900',
  COMPLETED: 'bg-green-100 text-green-900',
  ISSUED: 'bg-green-100 text-green-900',
  CANCELLED: 'bg-gray-200 text-gray-800',
  REJECTED: 'bg-red-100 text-red-900',
  REFUNDED: 'bg-gray-200 text-gray-800',
  NEW: 'bg-amber-100 text-amber-900',
  IN_PROGRESS: 'bg-blue-100 text-blue-900',
  RESOLVED: 'bg-green-100 text-green-900',
};

export function adminStatusLabel(status) {
  if (!status) return 'Not set';
  return STATUS_LABELS[status] || status.toLowerCase().replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
}

export default function AdminStatusBadge({ status }) {
  return <span className={`inline-flex px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-800'}`}>{adminStatusLabel(status)}</span>;
}
