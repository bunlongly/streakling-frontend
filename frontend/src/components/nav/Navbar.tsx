'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import NavLink from './NavLink';
import { PUBLIC_PRIMARY, AUTHED_PRIMARY, AUTHED_SECONDARY } from './NavConfig';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SideMenu from './SideMenu';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';

type Role = 'ADMIN' | 'USER' | undefined;

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function Navbar() {
  const [openSide, setOpenSide] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();

  const [role, setRole] = useState<Role>(undefined);
  const [loadingMe, setLoadingMe] = useState(false);

  // Scroll-aware background (down = show, up/top = hide)
  const [showBg, setShowBg] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      setShowBg(y > 4 && goingDown);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Backend role
  useEffect(() => {
    let stop = false;
    async function loadMe() {
      if (!isLoaded || !isSignedIn || !synced) return;
      setLoadingMe(true);
      try {
        const res = await api.profile.get();
        if (!stop) setRole((res.data as any)?.role as Role);
      } catch {
        if (!stop) setRole(undefined);
      } finally {
        if (!stop) setLoadingMe(false);
      }
    }
    loadMe();
    return () => {
      stop = true;
    };
  }, [isLoaded, isSignedIn, synced]);

  const sideAuthedSecondary =
    role === 'ADMIN'
      ? [...AUTHED_SECONDARY, { href: '/admin', label: 'Admin' }]
      : AUTHED_SECONDARY;

  return (
    <>
      <header
        className={cx(
          'sticky top-0 z-50 transition-colors duration-300',
          'border-b transition-[backdrop-filter,border-color] ease-out',
          showBg
            ? 'bg-white/60 backdrop-blur-xl border-white/30'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Top row */}
        <div className='relative h-16 sm:h-18 md:h-20 lg:h-24'>
          <div className='max-w-7xl mx-auto h-full px-3 sm:px-4 md:px-6'>
            <div className='h-full grid grid-cols-3 items-center gap-2'>
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

              {/* Center: Logo */}
              <div className='flex items-center justify-center'>
                <Link
                  href='/'
                  aria-label='Streakling Home'
                  className='flex items-center justify-center'
                >
                  <Image
                    src='/logo.png'
                    alt='Streakling'
                    width={640}
                    height={160}
                    priority
                    sizes='(max-width: 640px) 200px, (max-width: 1024px) 280px, 360px'
                    className='h-10 sm:h-12 md:h-16 lg:h-20 w-auto select-none'
                  />
                </Link>
              </div>

              {/* Right: Account */}
              <div className='flex items-center justify-end gap-2'>
                {isSignedIn && loadingMe ? (
                  <span
                    className='inline-block h-2 w-2 rounded-full bg-gray-300'
                    aria-hidden
                  />
                ) : null}

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

        {/* Centered short underline (subtle, responsive) */}
        <div className='flex justify-center'>
          <div
            className={cx(
              'border-t border-white/30 transition-opacity duration-300',
              'w-20 sm:w-24 md:w-28 lg:w-32',
              showBg ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        {/* Nav row — mobile friendly: scrollable, no wrap */}
        <nav className='max-w-7xl mx-auto px-2 sm:px-4 md:px-6 h-12 flex items-center justify-center'>
          <ul className='flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-full scrollbar-none'>
            {PUBLIC_PRIMARY.map(item => (
              <li key={item.href} className='shrink-0'>
                <NavLink href={item.href} label={item.label} />
              </li>
            ))}

            <SignedIn>
              {AUTHED_PRIMARY.map(item => (
                <li key={item.href} className='shrink-0'>
                  <NavLink href={item.href} label={item.label} />
                </li>
              ))}

              {role === 'ADMIN' && (
                <li className='shrink-0'>
                  <NavLink href='/admin' label='Admin' />
                </li>
              )}
            </SignedIn>
          </ul>
        </nav>
      </header>

      {/* Side menu */}
      <SideMenu
        open={openSide}
        onClose={() => setOpenSide(false)}
        publicPrimary={PUBLIC_PRIMARY}
        authedPrimary={AUTHED_PRIMARY}
        authedSecondary={sideAuthedSecondary}
      />
    </>
  );
}
