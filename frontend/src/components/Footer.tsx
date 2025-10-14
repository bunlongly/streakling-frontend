// src/components/Footer.tsx
'use client';

import Image from 'next/image';
import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  const sections: Record<string, string[]> = {
    Product: ['Overview', 'Features', 'Pricing', 'Challenges', 'Integrations'],
    Company: ['About', 'Careers', 'Press', 'Contact'],
    Resources: ['Blog', 'Help Center', 'API', 'Status'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy']
  };

  // noop for placeholder actions
  const stop: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <footer className='mt-16 bg-[color:var(--color-dark)] text-white/80'>
      <div className='mx-auto max-w-6xl px-6 py-12'>
        {/* Brand + short tagline */}
        <div className='flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left sm:items-start'>
          <Image
            src='/logo.png'
            alt='Streakling logo'
            width={56}
            height={56}
            className='h-14 w-auto'
            priority
          />
          <div>
            <p className='text-base font-semibold text-white'>Streakling</p>
            <p className='text-sm text-white/70'>
              The creator identity hub — digital card, portfolio, and
              challenges.
            </p>
          </div>
        </div>

        {/* Link columns (placeholder buttons so they don't navigate) */}
        <div className='mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {Object.entries(sections).map(([title, links]) => (
            <div key={title}>
              <p className='mb-3 text-sm font-semibold text-white'>{title}</p>
              <ul className='space-y-2 text-sm'>
                {links.map(label => (
                  <li key={label}>
                    <button
                      type='button'
                      onClick={stop}
                      aria-disabled='true'
                      className='cursor-default text-left text-white/80 hover:text-white transition'
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row'>
          <p className='text-sm'>
            © {year} <span className='font-semibold'>Streakling</span>. All
            rights reserved.
          </p>

          {/* Socials as non-navigating buttons */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={stop}
              aria-label='X (Twitter)'
              className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition'
            >
              <svg
                viewBox='0 0 24 24'
                className='h-4 w-4'
                fill='currentColor'
                aria-hidden
              >
                <path d='M18.244 2H21l-6.52 7.455L22 22h-6.59l-5.16-6.6L3.78 22H1l7.02-8.03L2 2h6.71l4.66 5.963L18.244 2Zm-2.31 18h2.02L8.15 4H6.03l9.905 16Z' />
              </svg>
            </button>
            <button
              type='button'
              onClick={stop}
              aria-label='Instagram'
              className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition'
            >
              <svg
                viewBox='0 0 24 24'
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.8}
                aria-hidden
              >
                <rect x='3' y='3' width='18' height='18' rx='5' />
                <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
                <circle
                  cx='17.5'
                  cy='6.5'
                  r='1'
                  fill='currentColor'
                  stroke='none'
                />
              </svg>
            </button>
            <button
              type='button'
              onClick={stop}
              aria-label='YouTube'
              className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition'
            >
              <svg
                viewBox='0 0 24 24'
                className='h-4 w-4'
                fill='currentColor'
                aria-hidden
              >
                <path d='M23.5 6.2a4 4 0 0 0-2.8-2.8C18.7 3 12 3 12 3s-6.7 0-8.7.4A4 4 0 0 0 .5 6.2 41.7 41.7 0 0 0 0 12a41.7 41.7 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.3 21.9 12 21.9 12 21.9s6.7 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.7 41.7 0 0 0 24 12a41.7 41.7 0 0 0-.5-5.8ZM9.6 15.5v-7L16 12l-6.4 3.5Z' />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
