'use client';

import LazyVideo from '@/components/LazyVideo';
import Link from 'next/link';

export default function OverviewShowcase() {
  return (
    <section
      id='overview'
      className='relative mt-20 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-white/10'
      aria-label='Product overview'
    >
      <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-2 md:gap-16'>
        {/* Left: Copy */}
        <div>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-primary)]' />
            Product Overview
          </span>

          <h2 className='mt-4 text-2xl sm:text-3xl font-semibold'>
            A quick look at Streakling
          </h2>
          <p className='mt-3 text-[15px] leading-7 opacity-80'>
            Build a <strong>Digital Card</strong>, showcase your{' '}
            <strong>Portfolio</strong>, join
            <strong> trending Challenges</strong>, and connect with creators
            across industries. One profile, one scan—everything your audience
            needs.
          </p>

          <ul className='mt-5 space-y-2 text-[15px]'>
            <li>• Build once, share anywhere</li>
            <li>• Showcase projects with images & video</li>
            <li>• Join challenges and gain visibility</li>
            <li>• Track engagement and growth</li>
          </ul>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/profile/cards/create'
              className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white bg-[color:var(--color-primary)] hover:opacity-90 transition'
            >
              Get Started
            </Link>
            <a
              href='#pricing'
              className='inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 transition'
              onClick={e => {
                e.preventDefault();
                const el = document.getElementById('pricing');
                if (el)
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              View Pricing
            </a>
          </div>
        </div>

        {/* Right: Video card */}
        <div className='relative'>
          <div className='relative overflow-hidden rounded-3xl border border-black/10 bg-black shadow-2xl ring-1 ring-black/10'>
            {/* Maintain 16:9 aspect ratio */}
            <div className='aspect-video'>
              <LazyVideo
                className='h-full w-full object-cover'
                autoPlay
                muted
                loop
                playsInline
                poster='/hero-poster.jpg'
                src='/overview.mp4'
                preload='none'
                rootMargin='400px'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
