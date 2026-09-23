import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const emptyForm = { rating: 5, comment: '' };

function Stars({ rating }) {
  return <span className="tracking-[0.18em]" aria-label={`${rating} out of 5 stars`}>
    <span aria-hidden="true">{'★'.repeat(rating)}<span className="text-border">{'★'.repeat(5 - rating)}</span></span>
  </span>;
}

export default function ProductReviews({ slug, reviews = [] }) {
  const location = useLocation();
  const [form, setForm] = useState(emptyForm);
  const { data: me, isLoading: isLoadingUser } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me'), retry: false });
  const submit = useMutation({
    mutationFn: body => api.post(`/products/${slug}/reviews`, body),
    onSuccess: () => setForm(emptyForm),
  });
  useEffect(() => {
    if (!submit.isSuccess) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => { if (event.key === 'Escape') submit.reset(); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [submit.isSuccess]);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return <section className="mt-16 border-t border-border pt-10" aria-labelledby="customer-reviews-title">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id="customer-reviews-title" className="section-title">Customer reviews</h2>
        {reviews.length > 0 && <p className="mt-3 text-sm text-muted"><Stars rating={Math.round(average)} /> <span className="ml-2">{average.toFixed(1)} from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></p>}
      </div>
    </div>

    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div>
        {reviews.length > 0 ? <div className="grid gap-5 sm:grid-cols-2">{reviews.map(review => <article key={review.id} className="border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{review.authorName}</p><Stars rating={review.rating} /></div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{review.comment}</p>
        </article>)}</div> : <div className="border border-border p-6 text-sm text-muted">No reviews yet. Be the first to review this product.</div>}
      </div>

      {isLoadingUser ? <div className="min-h-56 animate-pulse border border-border bg-surface" aria-label="Loading review form" /> : !me ? <div className="flex min-h-56 flex-col items-center justify-center border border-border p-6 text-center sm:p-8">
        <h3 className="text-xl font-semibold">Sign in to write a review</h3>
        <p className="mt-2 text-sm text-muted">You need a Bagiroo account before submitting a product review.</p>
        <Link to="/login" state={{ from: location }} className="store-button mt-6 bg-ink text-background">Login to review</Link>
      </div> : <form onSubmit={event => { event.preventDefault(); submit.mutate(form); }} className="border border-border p-6 sm:p-8">
        <h3 className="text-xl font-semibold">Write a review</h3>
        <p className="mt-2 text-sm text-muted">Reviews are published after approval.</p>
        <p className="mt-5 text-sm">Reviewing as <strong>{me.user.name || 'Bagiroo customer'}</strong></p>
        <fieldset className="mt-5"><legend className="text-sm">Rating *</legend><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map(rating => <label key={rating} className={`flex h-10 w-10 cursor-pointer items-center justify-center border text-lg transition-colors ${form.rating === rating ? 'border-ink bg-ink text-background' : 'border-border hover:border-ink'}`}><input type="radio" name="rating" value={rating} checked={form.rating === rating} onChange={() => { submit.reset(); setForm(current => ({ ...current, rating })); }} className="sr-only" /><span aria-hidden="true">★</span><span className="sr-only">{rating} stars</span></label>)}</div></fieldset>
        <label className="mt-5 block text-sm">Your review *<textarea required minLength={10} maxLength={3000} rows={5} value={form.comment} onChange={event => { submit.reset(); setForm(current => ({ ...current, comment: event.target.value })); }} className="admin-input mt-2" /></label>
        <button disabled={submit.isPending} className="store-button mt-5 w-full bg-ink text-background disabled:opacity-50">{submit.isPending ? 'Submitting…' : 'Submit review'}</button>
        {submit.isError && <p role="alert" className="mt-4 text-sm text-red-700">{submit.error.message}</p>}
      </form>}
    </div>
    {submit.isSuccess && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) submit.reset(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="review-success-title" className="relative w-full max-w-[430px] overflow-hidden rounded-2xl bg-white">
        <button type="button" onClick={() => submit.reset()} aria-label="Close confirmation" className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-xl leading-none text-ink transition-colors duration-200 hover:bg-ink hover:text-white">×</button>
        <div className="flex min-h-[330px] flex-col items-center justify-center px-7 py-12 text-center sm:px-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl text-white" aria-hidden="true">✓</div>
          <h2 id="review-success-title" className="text-2xl font-semibold leading-tight">Thanks for your review.</h2>
          <p className="mt-4 text-sm text-muted">It will appear after approval.</p>
          <button type="button" onClick={() => submit.reset()} className="store-button mt-8 w-full border border-transparent bg-ink text-background hover:border-ink">Continue</button>
        </div>
      </section>
    </div>}
  </section>;
}
