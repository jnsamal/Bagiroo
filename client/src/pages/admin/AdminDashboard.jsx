import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { ADMIN_SECTIONS } from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
  const { data: products } = useQuery({ queryKey: ['admin-products-count'], queryFn: () => api.get('/admin/products?perPage=1') });
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders') });
  const { data: returns } = useQuery({ queryKey: ['admin-returns'], queryFn: () => api.get('/admin/returns') });

  const pendingOrders = orders?.filter((o) => o.status === 'PENDING').length ?? '—';
  const pendingReturns = returns?.filter((r) => r.status === 'REQUESTED').length ?? '—';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-3xl font-semibold mt-2">{products?.meta?.total ?? '—'}</p>
        </div>
        <div className="border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Orders awaiting payment</p>
          <p className="text-3xl font-semibold mt-2">{pendingOrders}</p>
        </div>
        <div className="border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Return requests</p>
          <p className="text-3xl font-semibold mt-2">{pendingReturns}</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold mt-12 mb-6">Manage your website</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{ADMIN_SECTIONS.flatMap(section => section.links).filter(link => !link.end).map(link => <Link key={link.to} to={link.to} className="admin-panel hover:border-ink transition-colors"><p className="font-semibold">{link.label} <span aria-hidden="true">↗</span></p><p className="text-sm text-muted mt-2">{link.description}</p></Link>)}</div>
    </div>
  );
}
