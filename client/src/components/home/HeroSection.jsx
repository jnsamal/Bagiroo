import { resolveMediaUrl } from '../../lib/media';
import { Link } from 'react-router-dom';
import { useWebsite } from '../../lib/useWebsite';
import { safeUrl } from '../../lib/safeUrl';

// Real copy from the live site (audit-confirmed) + real hero photography
// supplied by the client. A flat dark overlay keeps the left-aligned text
// legible over the image without introducing gradients/glow effects the
// brand direction rules out.
const HERO_IMAGE_URL = '/uploads/site/hero.png';

export default function HeroSection() {
  const website = useWebsite();
  return (
    <section
      className="relative bg-ink text-background min-h-[520px] md:min-h-[640px] lg:min-h-[76vh] flex items-end md:items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${resolveMediaUrl(website.heroImage || HERO_IMAGE_URL)})` }}
    >
      <div className="absolute inset-0 bg-ink" style={{ opacity: (website.heroOverlay ?? 40) / 100 }} aria-hidden="true" />
      <div className="relative w-full px-5 sm:px-8 lg:px-12 py-16 md:py-24">
        <h1 className="max-w-xl text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-[-0.045em]">{website.heroTitle ?? 'Designed for every move'}</h1>
        <p className="mt-4 text-background/80 max-w-md">
          {website.heroDescription ?? 'Considered silhouettes, confident colour and room for the rhythm of your day.'}
        </p>
        <Link to={safeUrl(website.heroButtonUrl) || '/shop'} className="store-button hero-collection-button mt-8 bg-background text-ink">
          {website.heroButtonLabel ?? 'Explore the collection'}
        </Link>
      </div>
    </section>
  );
}
