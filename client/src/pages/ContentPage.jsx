import { useWebsite } from '../lib/useWebsite';
export default function ContentPage({ title, contentKey }) {
  const website = useWebsite();
  return <div className="store-section max-w-4xl"><h1 className="section-title mb-8">{title}</h1><div className="whitespace-pre-wrap leading-relaxed text-sm">{website[contentKey] || 'Content will be available soon.'}</div></div>;
}
