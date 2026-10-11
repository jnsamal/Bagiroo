import OptimizedImage from '../shared/OptimizedImage';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { safeUrl } from '../../lib/safeUrl';

export default function InstagramGrid({ posts }) {
  const { data: settings } = useQuery({ queryKey: ['settings', 'public'], queryFn: () => api.get('/settings/public') });
  const instagramUrl = safeUrl(settings?.socialLinks?.find(link => link.platform === 'instagram')?.url, { allowRelative: false });
  return (
    <section className="store-section !max-w-none">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title">Follow Bagiroo &amp; Co.</h2>
        {instagramUrl && <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-4 hover:text-ink"
        >
          Instagram ↗
        </a>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {posts.map((post, i) => (
          <a key={post.id} href={safeUrl(post.permalink, { allowRelative: false }) || instagramUrl} aria-label={post.caption || `Instagram post ${i + 1}`} target="_blank" rel="noopener noreferrer" className="group aspect-square overflow-hidden bg-surface border border-border flex items-center justify-center text-muted text-xs focus-visible:ring-2 focus-visible:ring-ink">
            {post.imageUrl ? (
              <OptimizedImage src={post.imageUrl} widths={[240, 360, 480, 640]} sizes="(max-width: 640px) 50vw, 25vw" alt={post.caption || `Bagiroo Instagram post ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            ) : (
              `INSTAGRAM ${String(i + 1).padStart(2, '0')}`
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
