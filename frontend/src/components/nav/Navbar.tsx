'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import NavLink from './NavLink';
import { PUBLIC_PRIMARY, AUTHED_PRIMARY, AUTHED_SECONDARY } from './NavConfig';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SideMenu from './SideMenu';

export default function Navbar() {
  const [openSide, setOpenSide] = useState(false);

  return (
    <>
      <header className='sticky top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-white/30'>
        {/* Top bar */}
        <div className='relative h-16'>
          <div className='max-w-7xl mx-auto h-full px-4 sm:px-6'>
            <div className='h-full grid grid-cols-3 items-center'>
              {/* Left: Hamburger */}
              <div className='flex items-center'>
                <button
                  type='button'
                  onClick={() => setOpenSide(true)}
                  className='inline-flex items-center justify-center rounded-lg h-9 w-9 border border-white/40 hover:opacity-90 bg-white/50'
                  aria-label='Open navigation menu'
                >
                  <MenuRoundedIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Center: Brand */}
              <div className='flex items-center justify-center'>
                <Link
                  href='/'
                  className='font-bold text-lg tracking-tight text-[color:var(--color-primary)]'
                  aria-label='Streakling Home'
                >
                  Streakling
                </Link>
              </div>

              {/* Right: Account (icon even when logged out) */}
              <div className='flex items-center justify-end'>
                <SignedIn>
                  <UserButton afterSignOutUrl='/' />
                </SignedIn>
                <SignedOut>
                  <Link
                    href='/sign-in'
                    aria-label='Sign in or register'
                    className='inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/40 bg-white/50 hover:opacity-90'
                    title='Sign in / Register'
                  >
                    <AccountCircleRoundedIcon sx={{ fontSize: 22 }} />
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>

        {/* Menu row */}
        <div className='border-t border-white/30'>
          <nav className='max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-center'>
            <ul className='flex items-center gap-1'>
              {PUBLIC_PRIMARY.map(item => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} />
                </li>
              ))}
              <SignedIn>
                {AUTHED_PRIMARY.map(item => (
                  <li key={item.href}>
                    <NavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </SignedIn>
            </ul>
          </nav>
        </div>
      </header>

      {/* Side (hamburger) menu — shows ALL authed links when logged in */}
      <SideMenu
        open={openSide}
        onClose={() => setOpenSide(false)}
        publicPrimary={PUBLIC_PRIMARY}
        authedPrimary={AUTHED_PRIMARY}
        authedSecondary={AUTHED_SECONDARY}
      />
    </>
  );
}
