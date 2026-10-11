import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { data: customer, isLoading, isError, error } = useQuery({ queryKey: ['admin-customer', id], queryFn: () => api.get(`/admin/customers/${id}`) });
  if (isLoading) return <p className="text-sm text-muted">Loading customer…</p>;
  if (isError) return <p role="alert" className="text-red-700">{error.message}</p>;

  const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalMinor, 0);
  const addresses = [...customer.addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  return <div>
    <Link to="/admin/customers" className="text-sm underline underline-offset-4">← All customers</Link>
    <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="admin-page-title">{customer.name || 'Profile incomplete'}</h1><p className="mt-2 text-sm text-muted">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p></div><span className={`px-3 py-1.5 text-xs ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{customer.isActive ? 'Active account' : 'Inactive account'}</span></div>

    <div className="mt-8 grid gap-5 lg:grid-cols-3">
      <Section title="Contact details"><Detail label="Email" value={<a href={`mailto:${customer.email}`} className="underline underline-offset-4">{customer.email}</a>} /><Detail label="Phone" value={customer.phone ? <a href={`tel:${customer.phone}`} className="underline underline-offset-4">{customer.phone}</a> : 'Not provided'} /><Detail label="Last profile update" value={new Date(customer.updatedAt).toLocaleString()} /></Section>
      <Section title="Customer summary"><Detail label="Orders" value={customer.orders.length} /><Detail label="Total spent" value={formatPrice(totalSpent)} /><Detail label="Saved items" value={customer.wishlistItems.length} /><Detail label="Return requests" value={customer.returns.length} /></Section>
      <Section title="Saved addresses">{addresses.length ? <div className="space-y-4">{addresses.map(address => <address key={address.id} className="not-italic text-sm leading-6"><p className="font-medium">{address.label || 'Address'} {address.isDefault && <span className="ml-2 bg-ink px-2 py-0.5 text-[10px] uppercase text-white">Default</span>}</p><p>{address.fullName} · {address.phone}</p><p className="text-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city}, {address.state} {address.postalCode}<br />{address.country}</p></address>)}</div> : <Empty text="No saved addresses." />}</Section>
    </div>

    <Section title="Order history" className="mt-5">{customer.orders.length ? <><div className="space-y-3 md:hidden">{customer.orders.map(order => <article key={order.id} className="border border-border p-4"><div className="flex items-start justify-between gap-3"><Link to={`/admin/orders/${order.id}`} className="font-medium underline">#{order.orderNumber}</Link><span className="font-medium">{formatPrice(order.totalMinor)}</span></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><AdminStatusBadge status={order.status} /><span className="text-xs text-muted">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {new Date(order.createdAt).toLocaleDateString()}</span></div></article>)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted"><tr><th className="py-3">Order</th><th className="py-3">Items</th><th className="py-3">Date</th><th className="py-3">Status</th><th className="py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-border">{customer.orders.map(order => <tr key={order.id}><td className="py-4"><Link to={`/admin/orders/${order.id}`} className="font-medium underline">#{order.orderNumber}</Link></td><td className="py-4">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td className="py-4">{new Date(order.createdAt).toLocaleDateString()}</td><td className="py-4"><AdminStatusBadge status={order.status} /></td><td className="py-4 text-right">{formatPrice(order.totalMinor)}</td></tr>)}</tbody></table></div></> : <Empty text="No orders yet." />}</Section>

    <div className="mt-5 grid gap-5 lg:grid-cols-2"><Section title="Saved items">{customer.wishlistItems.length ? <ul className="divide-y divide-border">{customer.wishlistItems.map(item => <li key={item.id} className="py-3 text-sm"><a href={`/product/${item.product.slug}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">{item.product.title} ↗</a></li>)}</ul> : <Empty text="No saved products." />}</Section><Section title="Returns">{customer.returns.length ? <ul className="divide-y divide-border">{customer.returns.map(item => <li key={item.id} className="py-3 text-sm"><div className="flex flex-wrap gap-2"><AdminStatusBadge status={item.status} /><AdminStatusBadge status={item.refundStatus} /></div><p className="mt-2 text-muted">{item.reason}</p><p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleDateString()}</p></li>)}</ul> : <Empty text="No return requests." />}</Section></div>
  </div>;
}

function Section({ title, className = '', children }) { return <section className={`border border-border bg-white p-5 ${className}`}><h2 className="mb-5 text-lg font-semibold">{title}</h2>{children}</section>; }
function Detail({ label, value }) { return <div className="mb-4 last:mb-0"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-1 break-words text-sm">{value}</p></div>; }
function Empty({ text }) { return <p className="text-sm text-muted">{text}</p>; }
