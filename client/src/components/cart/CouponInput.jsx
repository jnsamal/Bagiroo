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
      <label htmlFor="coupon-code" className="mb-2 block text-xs uppercase tracking-wider text-muted">Coupon code</label><form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(code);
        }}
        className="flex gap-2"
      >
        <input
          id="coupon-code" value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          className="form-field flex-1"
        />
        <button type="submit" disabled={mutation.isPending || !code.trim()} className="store-button border border-ink !px-4 disabled:opacity-40">
          {mutation.isPending ? 'Applying…' : 'Apply'}
        </button>
      </form>
      {appliedCoupon && (
        <p className="text-sm text-green-700 mt-2">
          "{appliedCoupon.code}" applied —{' '}
          <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate(null)} className="underline underline-offset-4 disabled:opacity-50">
            remove
          </button>
        </p>
      )}
      {mutation.isError && <p role="alert" className="text-sm text-red-700 mt-2">{mutation.error.message}</p>}
    </div>
  );
}
