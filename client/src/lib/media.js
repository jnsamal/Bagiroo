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

export function resolveMediaUrl(path) {
  const safe = safeUrl(path);
  if (!safe) return undefined;
  if (/^https?:\/\//i.test(safe)) return safe;
  return `${API_ORIGIN}${safe}`;
}
