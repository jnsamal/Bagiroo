import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { ADMIN_SECTIONS } from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
  const { data: products } = useQuery({ queryKey: ['admin-products-count'], queryFn: () => api.get('/admin/products?perPage=1') });
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders') });
  const { data: returns } = useQuery({ queryKey: ['admin-returns'], queryFn: () => api.get('/admin/returns') });
  const { data: contacts } = useQuery({ queryKey: ['admin-content', 'contacts'], queryFn: () => api.get('/admin/content/contacts') });
  const { data: reviews } = useQuery({ queryKey: ['admin-content', 'reviews'], queryFn: () => api.get('/admin/content/reviews') });
  const { data: inventory } = useQuery({ queryKey: ['admin-content', 'inventory'], queryFn: () => api.get('/admin/content/inventory') });

  const pendingOrders = orders?.filter((o) => o.status === 'PENDING').length ?? '—';
  const pendingReturns = returns?.filter((r) => r.status === 'REQUESTED').length ?? '—';
  const newMessages = contacts?.items?.filter(item => item.status === 'NEW').length ?? '—';
  const pendingReviews = reviews?.items?.filter(item => !item.isApproved).length ?? '—';
  const lowStock = inventory?.items?.filter(item => Math.max(0, item.quantityAvailable - item.quantityReserved) <= 5).length ?? '—';

  return (
    <div>
      <div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Overview</p><h1 className="admin-page-title">Welcome to Bagiroo Admin</h1><p className="mt-3 max-w-2xl text-sm text-muted">Choose a common task below, or review the items that need your attention.</p></div>

      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-4 text-lg font-semibold">What would you like to do?</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/admin/products/new" title="Add a product" description="Create a product and add its price and photos." />
          <QuickAction to="/admin/orders" title="Manage orders" description="Review payments and update order progress." />
          <QuickAction to="/admin/website" title="Edit the website" description="Change homepage content, branding and footer links." />
          <QuickAction to="/admin/content/contacts" title="Read messages" description="View enquiries sent through the contact form." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="store-summary-title">
        <h2 id="store-summary-title" className="mb-4 text-lg font-semibold">Store summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard to="/admin/products" label="Products" value={products?.meta?.total ?? '—'} help="View your catalogue" />
          <SummaryCard to="/admin/orders" label="Orders awaiting payment" value={pendingOrders} help={pendingOrders === 0 ? 'Nothing needs attention' : 'Review these orders'} attention={pendingOrders > 0} />
          <SummaryCard to="/admin/returns" label="New return requests" value={pendingReturns} help={pendingReturns === 0 ? 'Nothing needs attention' : 'Review these requests'} attention={pendingReturns > 0} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="attention-title">
        <div className="mb-4"><h2 id="attention-title" className="text-lg font-semibold">Attention needed</h2><p className="mt-1 text-sm text-muted">Items that may require a response or update.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard to="/admin/content/contacts" label="New customer messages" value={newMessages} help={newMessages === 0 ? 'No new messages' : 'Read and respond'} attention={newMessages > 0} />
          <SummaryCard to="/admin/content/reviews" label="Reviews awaiting approval" value={pendingReviews} help={pendingReviews === 0 ? 'No reviews waiting' : 'Review submissions'} attention={pendingReviews > 0} />
          <SummaryCard to="/admin/content/inventory" label="Low or out of stock" value={lowStock} help={lowStock === 0 ? 'Stock levels look healthy' : 'Update stock levels'} attention={lowStock > 0} />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="all-tools-title">
        <h2 id="all-tools-title" className="text-xl font-semibold">All admin tools</h2>
        <p className="mt-2 text-sm text-muted">Everything is grouped by the type of task.</p>
        <div className="mt-6 grid gap-8 xl:grid-cols-2">
          {ADMIN_SECTIONS.filter(section => section.links.some(link => !link.end)).map(section => <div key={section.group} className="admin-panel">
            <h3 className="border-b border-border pb-3 font-semibold">{section.group}</h3>
            <div className="divide-y divide-border">{section.links.filter(link => !link.end).map(link => <Link key={link.to} to={link.to} className="group flex items-center justify-between gap-5 py-4 first:pt-4 last:pb-0"><span><span className="block text-sm font-medium group-hover:underline">{link.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{link.description}</span></span><span aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-1">→</span></Link>)}</div>
          </div>)}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, title, description }) {
  return <Link to={to} className="group border border-ink bg-ink p-5 text-background transition-colors hover:bg-white hover:text-ink focus-visible:bg-white focus-visible:text-ink"><span className="flex items-center justify-between gap-3 font-semibold">{title}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span><span className="mt-2 block text-xs leading-5 opacity-70">{description}</span></Link>;
}

function SummaryCard({ to, label, value, help, attention = false }) {
  return <Link to={to} className={`admin-panel group transition-colors hover:border-ink focus-visible:border-ink ${attention ? 'border-amber-500 bg-amber-50' : ''}`}><span className="text-sm text-muted">{label}</span><span className="mt-2 block text-3xl font-semibold">{value}</span><span className="mt-4 flex items-center justify-between text-xs font-medium"><span>{help}</span><span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span></Link>;
}
