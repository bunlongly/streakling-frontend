// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import LazyVideo from '@/components/LazyVideo';
import PricingPlans from '@/components/PricingPlans';
import FAQ from '@/components/FAQ';
import OverviewShowcase from '@/components/OverviewShowcase';

/** Typewriter: types ➜ holds ➜ deletes ➜ repeats */
function TypeLoop({
  texts = ['Your creator identity, all in one link.'],
  typeMs = 65,
  deleteMs = 42,
  startDelay = 220,
  holdMs = 1400,
  caret = '|',
  loop = true
}: {
  texts?: string[];
  typeMs?: number;
  deleteMs?: number;
  startDelay?: number;
  holdMs?: number;
  caret?: string;
  loop?: boolean;
}) {
  const [i, setI] = useState(0);
  const [len, setLen] = useState(0);
  const [phase, setPhase] = useState<
    'idle' | 'typing' | 'holding' | 'deleting'
  >('idle');

  const reduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    );
  }, []);

  const curr = texts[i] ?? '';

  useEffect(() => {
    if (reduced) {
      setLen(curr.length);
      setPhase('idle');
      return;
    }
    const kick = window.setTimeout(() => setPhase('typing'), startDelay);
    return () => window.clearTimeout(kick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    if (reduced || phase === 'idle') return;
    let t: number;

    if (phase === 'typing') {
      if (len < curr.length) {
        t = window.setTimeout(() => setLen(len + 1), typeMs);
      } else {
        t = window.setTimeout(() => setPhase('holding'), holdMs);
      }
    } else if (phase === 'holding') {
      t = window.setTimeout(() => setPhase('deleting'), 0);
    } else if (phase === 'deleting') {
      if (len > 0) {
        t = window.setTimeout(() => setLen(len - 1), deleteMs);
      } else {
        if (!loop && i === texts.length - 1) {
          setPhase('idle');
        } else {
          setI((i + 1) % texts.length);
          setPhase('typing');
        }
      }
    }

    return () => window.clearTimeout(t);
  }, [
    phase,
    len,
    i,
    curr.length,
    typeMs,
    deleteMs,
    holdMs,
    loop,
    texts.length,
    reduced
  ]);

  const shown = reduced ? curr : curr.slice(0, len);

  return (
    <span className='relative'>
      {shown}
      {!reduced && phase !== 'idle' && (
        <span
          className='ml-1 inline-block align-baseline animate-type-caret text-white/90 caret-slim'
          aria-hidden
        >
          {caret}
        </span>
      )}
    </span>
  );
}

/** ------------ Framer Motion Variants (typed) ------------ */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { delay, when: 'beforeChildren', staggerChildren: 0.12 }
  })
};

const item: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: EASE_OUT }
  }
};

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  /** 🔒 Ensure initial scroll is at top on a fresh load (no hash) */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) {
      const prev = history.scrollRestoration as 'auto' | 'manual' | undefined;
      try {
        history.scrollRestoration = 'manual';
      } catch {}
      // Snap to top immediately on mount to avoid accidental y>0
      window.scrollTo(0, 0);
      // Restore browser default after a short tick
      const id = window.setTimeout(() => {
        try {
          history.scrollRestoration = prev ?? 'auto';
        } catch {}
      }, 300);
      return () => window.clearTimeout(id);
    }
  }, []);

  // ✅ Smooth scroll ONLY while this page is mounted
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'smooth';
    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);

  // Autoplay/pause hero video when in/out of view
  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <main className='min-h-dvh'>
      {/* ===== 100vh Hero with /video-intro.mp4 ===== */}
      {/* Use 100dvh to avoid address-bar resize nudging the page on mobile */}
      <section className='relative h-[100dvh] w-full overflow-hidden'>
        <video
          ref={videoRef}
          className='absolute inset-0 h-full w-full object-cover'
          autoPlay
          muted
          loop
          playsInline
          poster='/hero-poster.jpg'
          preload='metadata' /* helps first paint without heavy buffering */
        >
          <source src='/video-intro.mp4' type='video/mp4' />
        </video>

        <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50' />
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent' />

        <div className='relative z-10 flex h-full w-full items-center justify-center px-4'>
          <motion.div
            className='w-full text-center'
            initial='hidden'
            animate='show'
            variants={container}
          >
            {/* Centering: allow wrapping (no nowrap) and balance line breaks to avoid ugly wraps */}
            <div className='flex justify-center'>
              <h1
                className={[
                  'inline-flex items-baseline font-sans font-extrabold tracking-tight text-white drop-shadow',
                  'text-[clamp(28px,6vw,64px)]',
                  'text-balance'
                ].join(' ')}
                aria-label='Your creator identity, all in one link.'
              >
                <TypeLoop
                  texts={['Your creator identity, all in one link.']}
                  typeMs={65}
                  deleteMs={42}
                  holdMs={1400}
                  startDelay={220}
                  caret='|'
                  loop
                />
              </h1>
            </div>

            <motion.div
              className='mt-8 flex flex-wrap items-center justify-center gap-3'
              variants={container}
            >
              <motion.div variants={item}>
                <Link
                  href='/profile/cards/create'
                  className='inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white bg-[color:var(--color-primary)] hover:opacity-90 transition'
                >
                  Create Digital Card
                </Link>
              </motion.div>
              <motion.div variants={item}>
                <Link
                  href='/profile/portfolio'
                  className='inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium border border-white/60 text-white/95 hover:bg-white/10 transition'
                >
                  Explore Portfolios
                </Link>
              </motion.div>
              <motion.div variants={item}>
                <Link
                  href='/challenges'
                  className='inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium border border-white/60 text-white/95 hover:bg-white/10 transition'
                >
                  Join Challenges
                </Link>
              </motion.div>
            </motion.div>

            <motion.div className='mt-10 flex justify-center' variants={item}>
              <a
                href='#discover'
                className='group inline-flex items-center gap-2 text-white/80 hover:text-white transition'
                aria-label='Scroll to discover'
                onClick={e => {
                  e.preventDefault();
                  const el = document.getElementById('discover');
                  if (el)
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className='text-sm'>Scroll to discover</span>
                <svg
                  className='h-5 w-5 animate-bounce'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden
                >
                  <path d='M6 9l6 6 6-6' />
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Overview video (unchanged) ===== */}
      <motion.div
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.2 }}
        variants={container}
      >
        <OverviewShowcase />
      </motion.div>

      {/* ===== Below-hero content ===== */}
      <section
        id='discover'
        className='mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20 scroll-mt-24'
      >
        <motion.div
          className='grid gap-8 md:grid-cols-3'
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.2 }}
          variants={container}
        >
          <motion.div variants={item}>
            <Card
              title='Digital Card'
              desc='Share a scannable profile that unifies your socials, contact, and industry info—perfect for collabs and events.'
              href='/profile/cards/create'
              cta='Build your card'
            />
          </motion.div>
          <motion.div variants={item}>
            <Card
              title='Portfolio'
              desc='Show your best work with images and video, organized by projects. Link it from your card and socials.'
              href='/profile/portfolio'
              cta='Browse portfolios'
            />
          </motion.div>
          <motion.div variants={item}>
            <Card
              title='Trending Challenges'
              desc='Join time-boxed video challenges to grow faster. Submit, get featured, and connect with other creators.'
              href='/challenges'
              cta='See challenges'
            />
          </motion.div>
        </motion.div>

        {/* ===== Feature row #1 ===== */}
        <motion.div
          className='mt-16 grid items-center gap-8 md:gap-12 md:grid-cols-2'
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.25 }}
          variants={container}
        >
          <motion.div variants={item}>
            <BrowserMock title='streakling.com/search?industry=Fashion'>
              <LazyVideo
                className='h-full w-full object-cover'
                autoPlay
                muted
                loop
                playsInline
                poster='/hero-poster.jpg'
                src='/content-creators.mp4'
                preload='none'
                rootMargin='400px'
              />
              <div className='pointer-events-none absolute left-4 right-4 top-4'>
                <div className='mx-auto max-w-md rounded-full bg-white/90 px-4 py-2 shadow'>
                  <div className='flex items-center gap-2 text-[13px] text-black/70'>
                    <svg
                      viewBox='0 0 24 24'
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={2}
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      aria-hidden
                    >
                      <circle cx='11' cy='11' r='8' />
                      <path d='m21 21-4.3-4.3' />
                    </svg>
                    <span>Search creators by industry…</span>
                  </div>
                </div>
              </div>
            </BrowserMock>
          </motion.div>

          <motion.div variants={item}>
            <h2 className='text-2xl sm:text-3xl font-semibold'>
              Find creators by industry in seconds
            </h2>
            <p className='mt-3 text-[15px] leading-7 opacity-80'>
              Filter creators by industry—Fashion, Gaming, Tech, Beauty,
              Fitness, Food, and more. View their <strong>Digital Card</strong>,
              portfolio highlights, social links, and performance at a glance.
              Reach out for collabs with one click.
            </p>

            <ul className='mt-5 space-y-2 text-[15px]'>
              <li>• Smart search with industry tags</li>
              <li>• One-scan profile sharing via QR</li>
              <li>• Portfolio previews (images &amp; video)</li>
              <li>• Instant contact and social links</li>
            </ul>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                href='/profiles'
                className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white bg-[color:var(--color-primary)] hover:opacity-90 transition'
              >
                Explore creators
              </Link>
              <Link
                href='/profile/cards/create'
                className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border border-black/10 bg-white/70 backdrop-blur hover:bg-white/90 transition'
              >
                Create your card
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* ===== Feature row #2 (YOUR ORIGINAL ORDER) ===== */}
        <motion.div
          className='mt-16 grid items-center gap-8 md:gap-12 md:grid-cols-2'
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.25 }}
          variants={container}
        >
          {/* TEXT LEFT */}
          <motion.div className='md:order-1 order-2' variants={item}>
            <h2 className='text-2xl sm:text-3xl font-semibold'>
              Join trending challenges and submit your entry
            </h2>
            <p className='mt-3 text-[15px] leading-7 opacity-80'>
              Grow faster by joining time-boxed video challenges curated by the
              community. Submit a link, document, or image—your entry lives on
              your profile and can be discovered by collaborators and brands.
            </p>

            <ul className='mt-5 space-y-2 text-[15px]'>
              <li>• Weekly &amp; monthly trending topics</li>
              <li>• Submit via video link, document, or image</li>
              <li>• Auto-tagged by industry for discovery</li>
              <li>• Showcase results on your Digital Card</li>
            </ul>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                href='/challenges'
                className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white bg-[color:var(--color-primary)] hover:opacity-90 transition'
              >
                Browse challenges
              </Link>
              <Link
                href='/challenges/submit'
                className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border border-black/10 bg-white/70 backdrop-blur hover:bg-white/90 transition'
              >
                Submit your entry
              </Link>
            </div>
          </motion.div>

          {/* VIDEO RIGHT */}
          <motion.div className='md:order-2 order-1' variants={item}>
            <BrowserMock title='streakling.com/challenges/trending'>
              <LazyVideo
                className='h-full w-full object-cover'
                autoPlay
                muted
                loop
                playsInline
                poster='/hero-poster.jpg'
                src='/challenge.mp4'
                preload='none'
                rootMargin='400px'
              />
              <div className='pointer-events-none absolute left-4 right-4 bottom-4'>
                <div className='mx-auto max-w-sm rounded-xl bg-white/95 px-4 py-3 shadow'>
                  <div className='flex items-center gap-2 text-[13px] text-black/80'>
                    <svg
                      viewBox='0 0 24 24'
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={2}
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      aria-hidden
                    >
                      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                      <polyline points='7 10 12 5 17 10' />
                      <line x1='12' x2='12' y1='5' y2='21' />
                    </svg>
                    <span>Drop a link, document, or image to submit</span>
                  </div>
                </div>
              </div>
            </BrowserMock>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== Pricing (split component) ===== */}
      <motion.div
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.15 }}
        variants={container}
      >
        <PricingPlans />
      </motion.div>

      {/* ===== FAQ (split component) ===== */}
      <motion.div
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: prefersReducedMotion ? 0 : 0.15 }}
        variants={container}
      >
        <FAQ />
      </motion.div>

      {/* caret + styling (scoped) */}
      <style jsx>{`
        @keyframes caretBlink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        .animate-type-caret {
          animation: caretBlink 1.2s steps(1, end) infinite;
        }
        .caret-slim {
          font-weight: 600;
          transform: translateY(2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-type-caret {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

/** Simple card block */
function Card({
  title,
  desc,
  href,
  cta
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className='rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition'>
      <h3 className='text-lg font-semibold'>{title}</h3>
      <p className='mt-2 text-sm opacity-80'>{desc}</p>
      <Link
        href={href}
        className='mt-4 inline-flex items-center gap-2 text-[color:var(--color-primary)] font-medium hover:opacity-90'
      >
        {cta}
        <svg
          className='h-4 w-4'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden
        >
          <path d='M5 12h14' />
          <path d='M12 5l7 7-7 7' />
        </svg>
      </Link>
    </div>
  );
}

/** Browser-like frame with top bar and rounded corners */
function BrowserMock({
  children,
  title
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className='rounded-2xl border border-black/10 bg-white/70 backdrop-blur-sm shadow-sm'>
      {/* Top bar */}
      <div className='flex items-center gap-2 px-3 py-2 border-b border-black/10'>
        <div className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-[#ff5f56]' />
          <span className='h-2.5 w-2.5 rounded-full bg-[#ffbd2e]' />
          <span className='h-2.5 w-2.5 rounded-full bg-[#27c93f]' />
        </div>
        <div className='mx-3 flex-1 truncate rounded bg-white/60 px-3 py-1.5 text-[12px] text-black/70'>
          {title ?? 'streakling.com'}
        </div>
      </div>

      {/* Content area — TALLER (responsive fixed heights) */}
      <div className='relative h-64 sm:h-80 md:h-96 lg:h-[520px] overflow-hidden rounded-b-2xl bg-black'>
        {children}
      </div>
    </div>
  );
}
