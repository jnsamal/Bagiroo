import { useEffect, useState } from 'react';
import { safeUrl } from '../../lib/safeUrl';

export default function AnnouncementBar({ messages = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || messages.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => window.clearInterval(timer);
  }, [messages.length, paused]);
  if (!messages.length) return null;

  const go = (delta) => setIndex((i) => (i + delta + messages.length) % messages.length);
  const announcement = messages[index % messages.length];
  const linkUrl = safeUrl(announcement.linkUrl);

  return (
    <div className="bg-ink text-background text-xs tracking-wide uppercase flex items-center justify-between px-4 py-2 overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <button type="button" aria-label="Previous announcement" disabled={messages.length < 2} className="px-2 disabled:opacity-30" onClick={() => go(-1)}>‹</button>
      {linkUrl ? (
        <a key={announcement.id} href={linkUrl} className="announcement-slide flex-1 text-center leading-relaxed px-2 underline-offset-4 hover:underline focus-visible:underline">
          {announcement.message}
        </a>
      ) : (
        <span key={announcement.id} className="announcement-slide flex-1 text-center leading-relaxed px-2">{announcement.message}</span>
      )}
      <button type="button" aria-label="Next announcement" disabled={messages.length < 2} className="px-2 disabled:opacity-30" onClick={() => go(1)}>›</button>
    </div>
  );
}
