import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function CouponInput({ appliedCoupon }) {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (couponCode) => api.post('/cart/coupon', { code: couponCode || null }),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  });

  return (
    <div className="mt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(code);
        }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          className="border border-border px-3 py-2 text-sm flex-1"
        />
        <button type="submit" className="border border-ink px-4 py-2 text-sm uppercase">
          Apply
        </button>
      </form>
      {appliedCoupon && (
        <p className="text-sm text-green-700 mt-2">
          "{appliedCoupon.code}" applied —{' '}
          <button onClick={() => mutation.mutate(null)} className="underline">
            remove
          </button>
        </p>
      )}
      {mutation.isError && <p className="text-sm text-red-700 mt-2">{mutation.error.message}</p>}
    </div>
  );
}
