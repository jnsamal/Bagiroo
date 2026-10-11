// Server-supplied media (product photos, category images, videos) is
// stored as a relative path like "/uploads/products/xyz.jpg" -- correct
// when the API serves it, but wrong when the browser resolves it against
// the CLIENT's own origin (e.g. the Vite dev server on :5173 has no
// /uploads route of its own). This prefixes such paths with the API's
// origin so images actually load regardless of where the client is
// served from.
//
// In dev, the Vite proxy also forwards /uploads to the API as a fallback,
// so this works either way; VITE_API_URL lets a production deployment
// point at a different origin/subdomain for the API if needed.
import { safeUrl } from './safeUrl';

const API_ORIGIN = import.meta.env.VITE_API_URL || '';

function cloudinaryDeliveryUrl(url, { width, video = false } = {}) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'res.cloudinary.com') return url;
    const kind = video || parsed.pathname.includes('/video/upload/') ? 'video' : 'image';
    const marker = `/${kind}/upload/`;
    if (!parsed.pathname.includes(marker)) return url;
    // Avoid stacking our delivery transformations if a transformed URL is
    // passed through the resolver more than once.
    if (parsed.pathname.includes(`${marker}f_auto,q_auto`)) return parsed.toString();
    const transformations = kind === 'video'
      ? `f_auto,q_auto${width ? `,c_limit,w_${Math.round(width)}` : ''}`
      : `f_auto,q_auto,dpr_auto,c_limit${width ? `,w_${Math.round(width)}` : ',w_1600'}`;
    parsed.pathname = parsed.pathname.replace(marker, `${marker}${transformations}/`);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function resolveMediaUrl(path, options = {}) {
  const safe = safeUrl(path);
  if (!safe) return undefined;
  if (/^https?:\/\//i.test(safe)) return cloudinaryDeliveryUrl(safe, options);
  return `${API_ORIGIN}${safe}`;
}

export function responsiveMediaProps(path, {
  widths = [320, 480, 640, 960, 1280, 1600],
  sizes = '100vw',
} = {}) {
  const safe = safeUrl(path);
  const isCloudinaryImage = safe && /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(safe);
  if (!isCloudinaryImage) return { src: resolveMediaUrl(path) };
  const usableWidths = [...new Set(widths)].filter(width => Number.isFinite(width) && width > 0).sort((a, b) => a - b);
  return {
    src: resolveMediaUrl(path, { width: usableWidths.at(-1) || 1600 }),
    srcSet: usableWidths.map(width => `${resolveMediaUrl(path, { width })} ${width}w`).join(', '),
    sizes,
  };
}
