import { resolveMediaUrl } from '../../lib/media';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { safeUrl } from '../../lib/safeUrl';

export default function InstagramGrid({ posts }) {
  const { data: settings } = useQuery({ queryKey: ['settings', 'public'], queryFn: () => api.get('/settings/public') });
  const instagramUrl = safeUrl(settings?.socialLinks?.find(link => link.platform === 'instagram')?.url, { allowRelative: false });
  return (
    <section className="w-full px-5 sm:px-8 lg:px-12 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold">Follow Bagiroo&amp;Co.</h2>
        {instagramUrl && <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted text-sm"
        >
          Instagram ↗
        </a>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {posts.map((post, i) => (
          <a key={post.id} href={safeUrl(post.permalink, { allowRelative: false }) || instagramUrl} aria-label={post.caption || `Instagram post ${i + 1}`} target="_blank" rel="noopener noreferrer" className="aspect-square bg-surface border border-border flex items-center justify-center text-muted text-xs">
            {post.imageUrl ? (
              <img src={resolveMediaUrl(post.imageUrl)} alt={post.caption || ''} className="w-full h-full object-cover" />
            ) : (
              `INSTAGRAM ${String(i + 1).padStart(2, '0')}`
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
