import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AccountSidebar from './AccountSidebar';

// Two-column desktop layout, stacked on mobile -- per the spec's account
// dashboard requirement, plus a shared "Your Account" header (name/email)
// echoing the reference dashboard's top section. Individual account pages
// render as `children` and should NOT re-wrap themselves in their own
// max-width container.
export default function AccountLayout({ children }) {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });

  return (
    <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16 min-h-[65vh]">
      <div className="mb-10 md:mb-14">
        <h1 className="text-3xl md:text-4xl font-semibold">Hey {me?.user?.name || 'there'} <span aria-hidden="true">👋</span></h1>
      </div>

      <div className="flex flex-col md:flex-row md:gap-10 lg:gap-14">
        <AccountSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
