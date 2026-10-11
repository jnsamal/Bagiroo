import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/money';
import { AdminError, AdminLoading } from '../../components/admin/AdminAsyncState';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => api.get(`/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  });

  return <div>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Store</p><h1 className="admin-page-title">Customers</h1><p className="mt-2 text-sm text-muted">View registered customer profiles, addresses and purchase history.</p></div>
      <label className="w-full sm:max-w-sm"><span className="mb-2 block text-xs uppercase tracking-wider text-muted">Search customers</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, phone or email" className="form-field bg-white" /></label>
    </div>

    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Customers" value={data.length} />
      <Stat label="Active" value={data.filter(customer => customer.isActive).length} />
      <Stat label="Orders" value={data.reduce((sum, customer) => sum + customer.orderCount, 0)} />
      <Stat label="Revenue" value={formatPrice(data.reduce((sum, customer) => sum + customer.totalSpentMinor, 0))} />
    </div>

    {isLoading && <AdminLoading message="Loading customers…" />}
    {isError && <AdminError message={error.message} onRetry={refetch} />}
    {!isLoading && !isError && <>
      {!!data.length && <div className="space-y-3 md:hidden">{data.map(customer => <article key={customer.id} className="border border-border bg-white p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{customer.name || 'Profile incomplete'}</p><p className="mt-1 text-sm text-muted">{customer.email}</p><p className="text-sm text-muted">{customer.phone || 'No phone number'}</p></div><span className={`inline-flex px-2 py-1 text-xs ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{customer.isActive ? 'Active' : 'Inactive'}</span></div>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3 text-sm"><div><dt className="text-xs text-muted">Orders</dt><dd className="mt-1 font-medium">{customer.orderCount}</dd></div><div><dt className="text-xs text-muted">Total spent</dt><dd className="mt-1 font-medium">{formatPrice(customer.totalSpentMinor)}</dd></div><div><dt className="text-xs text-muted">Joined</dt><dd className="mt-1 font-medium">{new Date(customer.createdAt).toLocaleDateString()}</dd></div></dl>
        <Link to={`/admin/customers/${customer.id}`} className="mt-4 inline-flex border border-ink bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">View customer</Link>
      </article>)}</div>}
      <div className="hidden overflow-x-auto border border-border bg-white md:block">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border bg-[#f7f7f5] text-xs uppercase tracking-wide text-muted"><tr><th className="p-4">Customer</th><th className="p-4">Contact</th><th className="p-4">Orders</th><th className="p-4">Total spent</th><th className="p-4">Joined</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
        <tbody className="divide-y divide-border">{data.map(customer => <tr key={customer.id} className="hover:bg-[#fafaf8]">
          <td className="p-4 font-medium">{customer.name || 'Profile incomplete'}</td>
          <td className="p-4"><span className="block">{customer.email}</span><span className="block text-muted">{customer.phone || 'No phone'}</span></td>
          <td className="p-4">{customer.orderCount}</td><td className="p-4">{formatPrice(customer.totalSpentMinor)}</td>
          <td className="p-4">{new Date(customer.createdAt).toLocaleDateString()}</td>
          <td className="p-4"><span className={`inline-flex px-2 py-1 text-xs ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{customer.isActive ? 'Active' : 'Inactive'}</span></td>
          <td className="p-4 text-right"><Link to={`/admin/customers/${customer.id}`} className="font-medium underline underline-offset-4">View details</Link></td>
        </tr>)}</tbody>
      </table>
      {!data.length && <p className="p-10 text-center text-sm text-muted">No customers found.</p>}
      </div>
      {!data.length && <div className="border border-border bg-white p-10 text-center text-sm text-muted md:hidden">No customers found.</div>}
    </>}
  </div>;
}

function Stat({ label, value }) {
  return <div className="border border-border bg-white p-4"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}
