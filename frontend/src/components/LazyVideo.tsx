'use client';

import { useEffect, useRef, useState } from 'react';

type LazyVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  /** The real video src; attached only when intersecting */
  src: string;
  /** Load when within this many px of viewport (default 300) */
  rootMargin?: string;
};

export default function LazyVideo({
  src,
  poster,
  playsInline = true,
  muted = true,
  loop = true,
  autoPlay = true,
  preload = 'none',
  rootMargin = '300px',
  ...rest
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(async entry => {
          if (entry.isIntersecting) {
            if (!ready) setReady(true);
            if (autoPlay && !prefersReducedMotion) {
              try {
                await el.play();
              } catch {
                /* autoplay may be blocked; ignore */
              }
            }
          } else {
            el.pause();
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [autoPlay, ready, rootMargin]);

  return (
    <video
      ref={ref}
      playsInline={playsInline}
      muted={muted}
      loop={loop}
      preload={preload}
      poster={poster}
      {...(ready ? { src } : {})}
      {...rest}
    />
  );
}
