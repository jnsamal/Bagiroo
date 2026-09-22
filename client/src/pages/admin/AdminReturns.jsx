import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function AdminReturns() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-returns'], queryFn: () => api.get('/admin/returns') });

  const decide = useMutation({
    mutationFn: ({ id, status, refundStatus }) => api.patch(`/admin/returns/${id}`, { status, refundStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-returns'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Returns</h1>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {data && !data.length && <p className="text-sm text-gray-500">No return requests.</p>}
      <div className="space-y-4">
        {data?.map((ret) => (
          <div key={ret.id} className="border border-gray-200 p-4 text-sm">
            <p className="font-medium">Order #{ret.order.orderNumber}</p>
            <p className="text-gray-500">{ret.user?.name || ret.user?.phone} — {ret.reason}</p>
            <p className="mt-1">Status: {ret.status} · Refund: {ret.refundStatus}</p>
            {ret.status === 'REQUESTED' && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => decide.mutate({ id: ret.id, status: 'APPROVED', refundStatus: 'PENDING' })}
                  className="bg-gray-900 text-white px-4 py-2 text-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide.mutate({ id: ret.id, status: 'REJECTED' })}
                  className="border border-gray-300 px-4 py-2 text-xs"
                >
                  Reject
                </button>
              </div>
            )}
            {ret.status === 'APPROVED' && ret.refundStatus === 'PENDING' && (
              <button
                onClick={() => decide.mutate({ id: ret.id, status: 'COMPLETED', refundStatus: 'ISSUED' })}
                className="bg-gray-900 text-white px-4 py-2 text-xs mt-3"
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
