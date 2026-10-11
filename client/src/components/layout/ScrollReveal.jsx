import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollReveal({ children }) {
  const rootRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = new Set();
    const observer = prefersReducedMotion
      ? null
      : new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    const registerTargets = () => {
      root.querySelectorAll('section, [data-scroll-reveal]').forEach((element) => {
        if (targets.has(element)) return;
        targets.add(element);
        element.classList.add('scroll-reveal');
        if (prefersReducedMotion) element.classList.add('is-visible');
        else observer.observe(element);
      });
    };

    registerTargets();
    const mutationObserver = new MutationObserver(registerTargets);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer?.disconnect();
      targets.forEach((element) => element.classList.remove('scroll-reveal', 'is-visible'));
    };
  }, [location.pathname]);

  return <div ref={rootRef}>{children}</div>;
}
