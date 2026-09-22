import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const emptyForm = { code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', isActive: true };

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.get('/admin/coupons') });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/coupons', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Coupons</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({ ...form, discountValue: Number(form.discountValue) });
        }}
        className="flex flex-wrap gap-3 mb-8 items-end"
      >
        <input required placeholder="CODE" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm">
          <option value="PERCENTAGE">% off</option>
          <option value="FLAT">Flat amount off (minor units)</option>
        </select>
        <input required type="number" placeholder="Value" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="border border-gray-300 px-3 py-2 text-sm w-28" />
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 text-sm">
          Add coupon
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Code</th>
            <th className="p-3">Discount</th>
            <th className="p-3">Active</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data?.map((c) => (
            <tr key={c.id}>
              <td className="p-3">{c.code}</td>
              <td className="p-3">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : c.discountValue}</td>
              <td className="p-3">{c.isActive ? 'Yes' : 'No'}</td>
              <td className="p-3 text-right">
                <button onClick={() => deleteMutation.mutate(c.id)} className="text-red-600 underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
