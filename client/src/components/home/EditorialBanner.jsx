import { Link } from 'react-router-dom';
import { useWebsite } from '../../lib/useWebsite';
import { safeUrl } from '../../lib/safeUrl';

export default function EditorialBanner() {
  const website = useWebsite();
  return (
    <section className="bg-ink text-background px-6 py-20">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-semibold">{website.editorialTitle ?? 'Form follows feeling'}</h2>
        <p className="mt-3 text-background/80">
          {website.editorialDescription ?? 'A focused edit of structured companions, soft carryalls and everyday statements.'}
        </p>
        <Link to={safeUrl(website.editorialButtonUrl) || '/shop'} className="store-button hero-collection-button mt-6 bg-background text-ink">
          {website.editorialButtonLabel ?? 'Discover all bags'}
        </Link>
      </div>
    </section>
  );
}
