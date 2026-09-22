const STORAGE_KEY = 'bagiroo_recently_viewed';
export const HISTORY_LIMIT = 12;

export function readRecentlyViewed() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter((slug) => typeof slug === 'string' && slug.length > 0 && slug.length <= 200))].slice(0, HISTORY_LIMIT) : [];
  } catch { return []; }
}

export function recordRecentlyViewed(slug) {
  const previous = readRecentlyViewed().filter((entry) => entry !== slug);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([slug, ...previous].slice(0, HISTORY_LIMIT))); } catch { /* Browsing still works when storage is unavailable. */ }
  return previous;
}
