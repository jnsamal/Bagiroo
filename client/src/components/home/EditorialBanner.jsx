import { Link } from 'react-router-dom';
import { useWebsite } from '../../lib/useWebsite';
import { safeUrl } from '../../lib/safeUrl';

export default function EditorialBanner() {
  const website = useWebsite();
  return (
    <section className="bg-ink text-background px-5 sm:px-8 lg:px-12 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <p className="mb-3 text-xs uppercase tracking-[.2em] text-background/60">The Bagiroo edit</p><h2 className="section-title">{website.editorialTitle ?? 'Form follows feeling'}</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-background/80">
          {website.editorialDescription ?? 'A focused edit of structured companions, soft carryalls and everyday statements.'}
        </p>
        <Link to={safeUrl(website.editorialButtonUrl) || '/shop'} className="store-button hero-collection-button mt-8 border border-background bg-background text-ink">
          {website.editorialButtonLabel ?? 'Discover all bags'}
        </Link>
      </div>
    </section>
  );
}
