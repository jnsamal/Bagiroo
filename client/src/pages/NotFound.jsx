import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="mx-auto max-w-screen-md px-6 py-24 text-center" data-scroll-reveal>
      <p className="mb-3 text-xs uppercase tracking-[.2em] text-muted">404</p><h1 className="section-title">Page not found</h1>
      <p className="text-muted mt-4">The page may have moved or is no longer available.</p>
      <Link to="/shop" className="store-button mt-8 border border-ink bg-ink text-background">Continue shopping</Link>
    </div>
  );
}
