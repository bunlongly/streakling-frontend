'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** Show after this many pixels scrolled (default 280) */
  threshold?: number;
};

export default function BackToTop({ threshold = 280 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || document.documentElement.scrollTop;
        setVisible(y > threshold);
        ticking = false;
      });
    };

    // passive for perf
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial state
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const onClick = () => {
    // Smooth when available; instant if user prefers reduced motion
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='Back to top'
      className={[
        'fixed bottom-6 right-6 z-[60]',
        // button look
        'rounded-full shadow-lg backdrop-blur-sm',
        'bg-[color:var(--color-primary)] text-white',
        'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/60',
        // size
        'h-11 w-11 flex items-center justify-center',
        // show/hide animation
        'transition-opacity duration-300',
        visible
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      ].join(' ')}
    >
      {/* Up arrow icon */}
      <svg
        className='h-5 w-5'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden
      >
        <path d='M12 19V5' />
        <path d='m5 12 7-7 7 7' />
      </svg>
    </button>
  );
}
