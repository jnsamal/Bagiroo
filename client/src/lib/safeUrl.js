const UNSAFE_URL_CHARACTERS = /[\u0000-\u0020\u007f\\<>"'()]/;

// React escapes attribute text, but URL attributes also need a protocol
// allowlist because strings such as javascript: are valid attribute values.
export function safeUrl(value, { allowRelative = true } = {}) {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim();
  if (!candidate || UNSAFE_URL_CHARACTERS.test(candidate)) return undefined;
  if (allowRelative && /^\/(?!\/)/.test(candidate)) return candidate;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
