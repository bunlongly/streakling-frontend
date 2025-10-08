'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { PUBLIC_ITEMS, AUTHED_ITEMS } from './NavConfig';
import NavLink from './NavLink';

import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className='sticky top-0 z-50'>
      <div className='border-b border-token surface-brand/80 backdrop-blur'>
        <nav className='max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between'>
          {/* Left: Brand + Desktop Links */}
          <div className='flex items-center gap-8'>
            <Link
              href='/'
              className='shrink-0 font-bold text-lg tracking-tight text-[color:var(--color-primary)]'
              aria-label='Streakling Home'
            >
              Streakling
            </Link>

            <ul className='hidden md:flex items-center gap-2'>
              {PUBLIC_ITEMS.map(item => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} />
                </li>
              ))}
              <SignedIn>
                {AUTHED_ITEMS.map(item => (
                  <li key={item.href}>
                    <NavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </SignedIn>
            </ul>
          </div>

          {/* Right: Controls */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              aria-label='Search'
              className='hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm
                         bg-[color:var(--color-surface)] border border-token hover:opacity-90 transition'
            >
              <SearchRoundedIcon sx={{ fontSize: 18 }} />
              <span className='hidden md:inline'>Search</span>
              <kbd className='ml-1 text-[10px] px-1.5 py-0.5 rounded border border-token opacity-70'>
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            <SignedIn>
              <UserButton afterSignOutUrl='/' />
            </SignedIn>
            <SignedOut>
              <Link
                href='/sign-in'
                className='px-3 py-1.5 rounded-xl bg-[color:var(--color-primary)] text-white text-sm font-medium hover:opacity-90'
              >
                Sign in
              </Link>
            </SignedOut>

            {/* Mobile menu */}
            <button
              type='button'
              onClick={() => setOpen(true)}
              className='md:hidden inline-flex items-center justify-center rounded-lg h-9 w-9
                         bg-[color:var(--color-surface)] border border-token'
              aria-label='Open navigation menu'
            >
              <MenuRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </nav>
      </div>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        publicItems={PUBLIC_ITEMS}
        authedItems={AUTHED_ITEMS}
      />
    </div>
  );
}
