import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { useState } from 'react';
import AdminFeedback from '../../components/admin/AdminFeedback';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminAsyncState';

export default function AdminReturns() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-returns'], queryFn: () => api.get('/admin/returns') });
  const settings = useQuery({ queryKey: ['admin-return-settings'], queryFn: () => api.get('/admin/returns/settings') });

  const updateSettings = useMutation({
    mutationFn: (enabled) => api.patch('/admin/returns/settings', { enabled }),
    onMutate: () => setNotice(''),
    onSuccess: (result) => {
      queryClient.setQueryData(['admin-return-settings'], result);
      queryClient.invalidateQueries({ queryKey: ['settings', 'public'] });
      setNotice(result.enabled ? 'New return requests are now enabled.' : 'New return requests are now paused.');
    },
  });

  const decide = useMutation({
    mutationFn: ({ id, status, refundStatus }) => api.patch(`/admin/returns/${id}`, { status, refundStatus }),
    onMutate: () => setNotice(''),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ['admin-returns'] }); setNotice(variables.refundStatus === 'ISSUED' ? 'Refund marked as issued.' : variables.status === 'APPROVED' ? 'Return request approved.' : 'Return request rejected.'); },
  });

  return (
    <div>
      <div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[.2em] text-muted">Store</p><h1 className="admin-page-title">Returns</h1></div>
      <section className="admin-panel mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Accept customer returns</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {settings.data?.enabled === false
              ? 'New return requests are paused. Existing requests can still be reviewed below.'
              : 'Customers can submit new return requests for eligible delivered orders.'}
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 self-start sm:self-auto">
          <span className="text-sm font-medium">{settings.data?.enabled === false ? 'Off' : 'On'}</span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={settings.data?.enabled !== false}
              disabled={settings.isLoading || settings.isError || updateSettings.isPending}
              onChange={(event) => updateSettings.mutate(event.target.checked)}
              aria-label="Accept customer returns"
            />
            <span className="h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
            <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </section>
      {settings.isError && <AdminError message={settings.error.message} onRetry={settings.refetch} />}
      {updateSettings.isError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{updateSettings.error.message}</p>}
      {isLoading && <AdminLoading message="Loading return requests…" />}
      {isError && <AdminError message={error.message} onRetry={refetch} />}
      {decide.isError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{decide.error.message}</p>}
      <AdminFeedback>{notice}</AdminFeedback>
      {data && !data.length && <AdminEmpty title="No return requests" description="Customer return requests will appear here." />}
      <div className="space-y-4">
        {data?.map((ret) => (
          <div key={ret.id} className="admin-panel text-sm">
            <p className="font-medium">Order #{ret.order.orderNumber}</p>
            <p className="text-gray-500">{ret.user?.name || ret.user?.email || ret.user?.phone || 'Customer'} — {ret.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-muted">Request</span><AdminStatusBadge status={ret.status} /><span className="ml-2 text-xs text-muted">Refund</span><AdminStatusBadge status={ret.refundStatus} /></div>
            {ret.status === 'REQUESTED' && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => decide.mutate({ id: ret.id, status: 'APPROVED', refundStatus: 'PENDING' })}
                  disabled={decide.isPending}
                  className="admin-primary !px-4 !py-2 !text-xs disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide.mutate({ id: ret.id, status: 'REJECTED' })}
                  disabled={decide.isPending}
                  className="border border-border bg-white px-4 py-2 text-xs disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            {ret.status === 'APPROVED' && ret.refundStatus === 'PENDING' && (
              <button
                onClick={() => decide.mutate({ id: ret.id, status: 'COMPLETED', refundStatus: 'ISSUED' })}
                disabled={decide.isPending}
                className="admin-primary !px-4 !py-2 !text-xs mt-3 disabled:opacity-50"
              >
                Mark refund issued
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
