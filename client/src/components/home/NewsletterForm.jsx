import { useState } from 'react';
import { api } from '../../lib/api';
import { useWebsite } from '../../lib/useWebsite';

export default function NewsletterForm() {
  const website = useWebsite();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await api.post('/newsletter', { email, source: 'homepage_footer' });
      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <section className="bg-surface px-5 sm:px-8 lg:px-12 py-16">
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold">{website.newsletterTitle ?? 'Join our world'}</h2>
          <p className="text-muted mt-1">{website.newsletterDescription ?? 'Product stories, new arrivals and considered edits, delivered occasionally.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full md:w-auto" noValidate>
          <label htmlFor="newsletter-email" className="mb-2 block text-xs uppercase tracking-widest">Email address</label>
          <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 border border-border px-4 flex-1 md:w-72 bg-background"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="store-button border border-ink bg-ink text-background whitespace-nowrap disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending…' : 'Subscribe'}
          </button>
          </div>
          <p className="mt-2 text-xs text-muted">Occasional product updates. Unsubscribe at any time.</p>
        </form>
      </div>
      {message && (
        <p role="status" className={`w-full mt-3 text-sm ${status === 'error' ? 'text-red-700' : 'text-muted'}`}>
          {message}
        </p>
      )}
    </section>
  );
}
