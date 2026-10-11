import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import AdminInvoiceButton from '../../components/admin/AdminInvoiceButton';
import { adminStatusLabel } from '../../components/admin/AdminStatusBadge';
import AdminFeedback from '../../components/admin/AdminFeedback';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminAsyncState';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notice, setNotice] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders') });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onMutate: () => setNotice(''),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); setNotice(`Order status changed to “${adminStatusLabel(variables.status)}”.`); },
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = data?.filter(order => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const searchable = [order.orderNumber, order.user?.name, order.user?.email, order.user?.phone, order.guestEmail].filter(Boolean).join(' ').toLowerCase();
    return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
  }) || [];

  function changeOrderStatus(order, status) {
    if (status === order.status) return;
    if (['CANCELLED', 'REFUNDED'].includes(status)) {
      const action = status === 'CANCELLED' ? 'cancel' : 'mark as refunded';
      const confirmed = window.confirm(`Are you sure you want to ${action} order #${order.orderNumber}?\n\nThe customer-facing order status will change immediately.`);
      if (!confirmed) return;
    }
    updateStatus.mutate({ id: order.id, status });
  }

  return (
    <div>
      <div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Store</p><h1 className="admin-page-title">Orders</h1><p className="mt-2 text-sm text-muted">Find orders by order number or customer details, then update their progress.</p></div>
      {isLoading && <AdminLoading message="Loading orders…" />}
      {isError && <AdminError message={error.message} onRetry={refetch} />}
      {updateStatus.isError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{updateStatus.error.message}</p>}
      <AdminFeedback>{notice}</AdminFeedback>
      {!isLoading && !isError && !data?.length && <AdminEmpty title="No orders yet" description="New customer orders will appear here." />}
      {!isLoading && !isError && data?.length > 0 && <>
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px_auto]">
          <label className="flex border border-border bg-white focus-within:border-ink"><span className="flex items-center pl-4 text-muted" aria-hidden="true">⌕</span><span className="sr-only">Search orders</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Order number, name, email or phone" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /></label>
          <select aria-label="Filter orders by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="border border-border bg-white px-3 py-3 text-sm"><option value="ALL">All order statuses</option>{STATUSES.map(status => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}</select>
          {(search || statusFilter !== 'ALL') && <button type="button" onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="border border-border bg-white px-4 py-3 text-sm hover:border-ink">Clear filters</button>}
        </div>
        <p role="status" className="mb-3 text-xs text-muted">Showing {filteredOrders.length} of {data.length} {data.length === 1 ? 'order' : 'orders'}</p>
        {filteredOrders.length ? <><div className="space-y-3 md:hidden">{filteredOrders.map(order => <article key={order.id} className="border border-border bg-white p-4">
          <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Order #{order.orderNumber}</p><p className="mt-1 text-sm text-muted">{order.user?.name || order.guestEmail || 'Customer details unavailable'}</p></div><p className="shrink-0 font-medium">{formatPrice(order.totalMinor)}</p></div>
          <label className="mt-4 block text-xs font-medium text-muted">Order status<select value={order.status} onChange={event => changeOrderStatus(order, event.target.value)} disabled={updateStatus.isPending} className="mt-2 w-full border border-border bg-white px-3 py-3 text-sm text-ink disabled:opacity-50">{STATUSES.map(status => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}</select></label>
          <div className="mt-4 flex flex-wrap gap-3"><Link to={`/admin/orders/${order.id}`} className="border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">View order</Link><AdminInvoiceButton order={order} /></div>
        </article>)}</div><div className="hidden overflow-x-auto border border-border bg-white md:block"><table className="w-full min-w-[760px] text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Order</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredOrders.map((order) => (
            <tr key={order.id} className="hover:bg-surface">
              <td className="p-3">#{order.orderNumber}</td>
              <td className="p-3">{order.user?.name || order.guestEmail || '—'}</td>
              <td className="p-3">{formatPrice(order.totalMinor)}</td>
              <td className="p-3">
                <select
                  value={order.status}
                  onChange={(e) => changeOrderStatus(order, e.target.value)}
                  disabled={updateStatus.isPending}
                  className="border border-border bg-white px-2 py-2 disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {adminStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3"><div className="flex items-start gap-3">
                <Link to={`/admin/orders/${order.id}`} className="border border-gray-300 px-3 py-2 text-xs font-medium uppercase tracking-wide hover:border-ink">View</Link>
                <AdminInvoiceButton order={order} />
              </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></> : <div className="admin-panel text-sm text-muted">No orders match your current search and status filter.</div>}
      </>}
    </div>
  );
}
