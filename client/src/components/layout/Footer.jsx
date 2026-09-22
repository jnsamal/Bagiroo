import { Link } from 'react-router-dom';
import { useWebsite } from '../../lib/useWebsite';
import { safeUrl } from '../../lib/safeUrl';

// Column structure and copy confirmed from the live site audit.
const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
};

function SocialIcon({ platform }) {
  const paths = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
    facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z" />,
    pinterest: <><circle cx="12" cy="12" r="9" /><path d="M9.5 20c.8-2.4 1.5-5 2-7.5-.8-2 .4-4 1.8-4 1.2 0 1.8.9 1.8 2 0 1.3-.8 3.2-1.2 4.9-.4 1.4.7 2.6 2 2.6 2.4 0 4-3 4-6.2 0-3.2-2.6-5.8-6.8-5.8-4.9 0-7.8 3.5-7.8 7.2 0 1.4.5 2.9 1.5 3.7" /></>,
    whatsapp: <><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" /><path d="M9 8.5c.5 3 2.5 5 5.5 6l1.3-1.4-2-1-1 1c-1.3-.7-2.4-1.8-3-3l1-1-1-2-1.8 1.4Z" /></>,
  };
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[platform] || <><circle cx="12" cy="12" r="9" /><path d="m9 15 6-6M10 9h5v5" /></>}</svg>;
}

// Only renders social links that are actually configured (non-empty URL),
// per the spec — no placeholder "#" links for unconfigured platforms.
export default function Footer({ socialLinks = [] }) {
  const website = useWebsite();
  return (
    <footer className="store-footer bg-ink text-background">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 py-12 md:py-16">
        <div className="flex flex-wrap gap-5 items-center justify-between border-b border-white/10 pb-6 mb-10">
          <span className="font-medium">Follow Bagiroo&amp;Co.</span>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => safeUrl(link.url, { allowRelative: false }) && (
              <a key={link.id} href={safeUrl(link.url, { allowRelative: false })} target="_blank" rel="noopener noreferrer" className="social-icon-link w-10 h-10 border border-white/30 rounded-full inline-flex items-center justify-center transition-colors hover:bg-background hover:text-ink" aria-label={PLATFORM_LABELS[link.platform] || link.platform} title={PLATFORM_LABELS[link.platform] || link.platform}>
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div>
            <h2 className="footer-brand-heading text-2xl font-medium mb-3">{website.siteName || 'Bagiroo & Co.'}</h2>
            <p className="text-background/70">{website.footerDescription ?? 'Contemporary bags designed for everyday movement.'}</p>
          </div>
          <div>
            <p className="font-medium mb-3">Shop</p>
            <ul className="space-y-2 text-background/80">
              <li><Link to="/shop">Collection</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
              <li><Link to="/best-sellers">Best Sellers</Link></li>
              <li><Link to="/shop-by-video">Shop by Video</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-3">Help</p>
            <ul className="space-y-2 text-background/80">
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-3">Customer Care</p>
            <p className="text-background/80">
              Questions about an order? Visit our <Link to="/contact">Contact page</Link>.
            </p>
          </div>
        </div>

        <p className="text-xs text-background/50 mt-10">
          © {new Date().getFullYear()} {website.siteName || 'Bagiroo & Co.'} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
