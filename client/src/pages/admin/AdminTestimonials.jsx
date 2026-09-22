import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const emptyForm = { authorName: '', quote: '', rating: 5 };

export default function AdminTestimonials() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const { data, isLoading } = useQuery({ queryKey: ['admin-testimonials'], queryFn: () => api.get('/admin/testimonials') });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/testimonials', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });

  const toggleVisible = useMutation({
    mutationFn: ({ id, isVisible }) => api.patch(`/admin/testimonials/${id}`, { isVisible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Testimonials</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(form);
        }}
        className="space-y-3 max-w-md mb-10 border border-gray-200 p-6"
      >
        <input required placeholder="Customer name" value={form.authorName} onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} className="w-full border border-gray-300 px-3 py-2" />
        <textarea required placeholder="Quote" value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} className="w-full border border-gray-300 px-3 py-2" rows={3} />
        <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="border border-gray-300 px-3 py-2 w-20" />
        <button type="submit" className="bg-gray-900 text-white px-4 py-2 text-sm">
          Add real testimonial
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      <div className="space-y-3">
        {data?.map((t) => (
          <div key={t.id} className="border border-gray-200 p-4 text-sm flex justify-between items-start">
            <div>
              <p className="font-medium">{t.authorName} {t.isPlaceholder && <span className="text-xs text-orange-600">(placeholder)</span>}</p>
              <p className="text-gray-500">{t.quote}</p>
            </div>
            <div className="flex gap-3 shrink-0 ml-4">
              <button onClick={() => toggleVisible.mutate({ id: t.id, isVisible: !t.isVisible })} className="underline">
                {t.isVisible ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => deleteMutation.mutate(t.id)} className="text-red-600 underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
