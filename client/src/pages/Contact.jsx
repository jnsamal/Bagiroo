import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useWebsite } from '../lib/useWebsite';

const initialForm = { name: '', email: '', phone: '', orderNumber: '', subject: 'Order help', message: '', website: '' };

export default function Contact() {
  const website = useWebsite();
  const [form, setForm] = useState(initialForm);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me'), retry: false });
  const accountForm = () => ({ ...initialForm, name: me?.user?.name || '', email: me?.user?.email || '', phone: me?.user?.phone || '' });
  const submit = useMutation({
    mutationFn: body => api.post('/contact', body),
    onSuccess: () => setForm(accountForm()),
  });
  const update = event => { submit.reset(); setForm(current => ({ ...current, [event.target.name]: event.target.value })); };

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

  useEffect(() => {
    if (me?.user) setForm(current => ({ ...current, name: current.name || me.user.name || '', email: current.email || me.user.email || '', phone: current.phone || me.user.phone || '' }));
  }, [me]);

  return <div className="store-section max-w-6xl">
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-12 lg:gap-20">
      <div>
        <h1 className="section-title">Contact us</h1>
        <div className="whitespace-pre-wrap leading-relaxed text-sm text-muted mt-6">{website.contactContent || 'Questions about a product or an existing order? Send us a message and our customer care team will get back to you.'}</div>
        <p className="text-sm mt-8">Please include your order number when contacting us about an existing purchase.</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); submit.mutate(form); }} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="text-sm">Name *<input required minLength={2} maxLength={120} name="name" value={form.name} onChange={update} autoComplete="name" className="admin-input mt-2" /></label>
          <label className="text-sm">Email *<input required type="email" maxLength={254} name="email" value={form.email} onChange={update} autoComplete="email" className="admin-input mt-2" /></label>
          <label className="text-sm">Phone<input type="tel" maxLength={30} name="phone" value={form.phone} onChange={update} autoComplete="tel" className="admin-input mt-2" /></label>
          <label className="text-sm">Order number<input maxLength={100} name="orderNumber" value={form.orderNumber} onChange={update} className="admin-input mt-2" /></label>
        </div>
        <label className="block text-sm">How can we help? *<select required name="subject" value={form.subject} onChange={update} className="admin-input mt-2"><option>Order help</option><option>Product question</option><option>Returns and refunds</option><option>Wholesale enquiry</option><option>Other</option></select></label>
        <label className="block text-sm">Message *<textarea required minLength={10} maxLength={5000} rows={7} name="message" value={form.message} onChange={update} className="admin-input mt-2" /></label>
        <label className="absolute -left-[10000px]" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></label>
        <button disabled={submit.isPending} className="store-button bg-ink text-background disabled:opacity-50">{submit.isPending ? 'Sending…' : 'Send message'}</button>
        {submit.isError && <p role="alert" className="text-sm text-red-700">{submit.error.message}</p>}
      </form>
    </div>
    {submit.isSuccess && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) submit.reset(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="contact-success-title" className="relative w-full max-w-[430px] overflow-hidden rounded-2xl bg-white">
        <button type="button" onClick={() => submit.reset()} aria-label="Close confirmation" className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-xl leading-none text-ink transition-colors duration-200 hover:bg-ink hover:text-white">×</button>
        <div className="flex min-h-[330px] flex-col items-center justify-center px-7 py-12 text-center sm:px-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl text-white" aria-hidden="true">✓</div>
          <h2 id="contact-success-title" className="text-2xl font-semibold leading-tight">Thanks — your message has been received.</h2>
          <p className="mt-4 text-sm text-muted">We’ll get back to you soon.</p>
          <button type="button" onClick={() => submit.reset()} className="store-button mt-8 w-full border border-transparent bg-ink text-background hover:border-ink">Continue</button>
        </div>
      </section>
    </div>}
  </div>;
}
